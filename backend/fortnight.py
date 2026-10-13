"""Authenticated Fortnight profile, shift, and compliance-check endpoints."""

from datetime import date, time, timedelta
from decimal import Decimal
from typing import Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator

import crud
from auth import get_user_from_supabase, require_bearer_token


MAX_SHIFT_HOURS = Decimal("16")
# The single source of truth for visa options and their fortnightly caps.
# None means no fortnightly cap. Unknown saved values are also treated as uncapped.
VISA_LIMITS: dict[str, Optional[Decimal]] = {
    "Student visa (subclass 500)": Decimal("48"),
    "Student visa (subclass 500) - aged care sector": None,
    "Student guardian visa (subclass 590)": None,
    "Other / not listed": None,
}
NO_CAP_MESSAGE = "No fortnightly cap in place for your visa type."
MAX_LABEL_LENGTH = 60

router = APIRouter(prefix="/api", tags=["Fortnight"])


class ProfilePayload(BaseModel):
    visaType: str
    studyPeriodStart: date
    studyPeriodEnd: date


class ProfileResponse(ProfilePayload):
    pass


def blank_to_none(value):
    """Trim optional free-text labels and store empty ones as NULL."""
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return value


class ShiftPayload(BaseModel):
    date: date
    startTime: time
    endTime: time
    # Optional, user-chosen label only; no other employer details are collected.
    employer: Optional[str] = Field(default=None, max_length=MAX_LABEL_LENGTH)

    _trim_employer = field_validator("employer", mode="before")(blank_to_none)


class ShiftResponse(ShiftPayload):
    id: str
    hours: float


class BreakPayload(BaseModel):
    label: Optional[str] = Field(default=None, max_length=MAX_LABEL_LENGTH)
    startDate: date
    endDate: date

    _trim_label = field_validator("label", mode="before")(blank_to_none)


class BreakResponse(BreakPayload):
    id: str


class ShiftCheckResponse(BaseModel):
    safe: bool
    currentHours: float
    projectedHours: float
    reason: str
    status: Literal["safe", "tight", "over"]
    remainingHours: Optional[float]
    limitHours: Optional[float]
    unlimited: bool
    windowStart: date
    windowEnd: date
    dailyHours: list["DailyHours"]
    breakHours: float
    proposedShiftInBreak: bool


class VisaTypeOption(BaseModel):
    label: str
    limitHours: Optional[float]


class DailyHours(BaseModel):
    date: date
    hours: float
    inBreak: bool = False


class EmployerHours(BaseModel):
    employer: Optional[str]
    hours: float


class HomeSummaryResponse(BaseModel):
    windowStart: date
    windowEnd: date
    currentHours: float
    remainingHours: Optional[float]
    limitHours: Optional[float]
    status: Literal["safe", "tight", "over"]
    unlimited: bool
    dailyHours: list[DailyHours]
    breakHours: float
    employerHours: list[EmployerHours]
    todayInBreak: bool
    recentShifts: list[ShiftResponse]


async def get_user_id_from_token(access_token: str) -> str:
    """Validate a bearer token through Supabase and return its user ID."""
    user = await get_user_from_supabase(access_token)
    return user.id


def calculate_duration(start_time: time, end_time: time) -> Decimal:
    """Return a same-day shift duration in hours."""
    start_minutes = start_time.hour * 60 + start_time.minute
    end_minutes = end_time.hour * 60 + end_time.minute
    duration = Decimal(end_minutes - start_minutes) / Decimal(60)

    if duration <= 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="End time must be after start time.")
    if duration > MAX_SHIFT_HOURS:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="A shift cannot be longer than 16 hours.")

    return duration.quantize(Decimal("0.01"))


def get_visa_limit(visa_type: str) -> Optional[Decimal]:
    """Return the fortnightly cap for a saved visa type, or None when uncapped."""
    return VISA_LIMITS.get(visa_type)


def get_usage_status(hours: Decimal, limit: Optional[Decimal]) -> Literal["safe", "tight", "over"]:
    if limit is None or hours < limit * Decimal("0.75"):
        return "safe"
    if hours <= limit:
        return "tight"
    return "over"


def find_break(day: date, breaks: list[dict]) -> Optional[dict]:
    """Return the break period containing this date, if any."""
    for period in breaks:
        if date.fromisoformat(period["startDate"]) <= day <= date.fromisoformat(period["endDate"]):
            return period
    return None


def sum_hours(shifts: list[dict]) -> Decimal:
    return sum((Decimal(str(shift["hours"])) for shift in shifts), Decimal("0")).quantize(Decimal("0.01"))


def build_daily_hours(shifts: list[dict], window_start: date, window_end: date, breaks: list[dict]) -> list[DailyHours]:
    totals = {window_start + timedelta(days=offset): Decimal("0") for offset in range(14)}
    for shift in shifts:
        shift_date = date.fromisoformat(shift["date"])
        if shift_date in totals:
            totals[shift_date] += Decimal(str(shift["hours"]))
    return [
        DailyHours(date=day, hours=float(hours.quantize(Decimal("0.01"))), inBreak=find_break(day, breaks) is not None)
        for day, hours in totals.items()
    ]


def build_employer_hours(shifts: list[dict]) -> list[EmployerHours]:
    totals: dict[Optional[str], Decimal] = {}
    for shift in shifts:
        employer = shift.get("employer")
        totals[employer] = totals.get(employer, Decimal("0")) + Decimal(str(shift["hours"]))
    ordered = sorted(totals.items(), key=lambda item: (-item[1], item[0] is None, item[0] or ""))
    return [EmployerHours(employer=employer, hours=float(hours.quantize(Decimal("0.01")))) for employer, hours in ordered]


def build_usage_summary(shifts: list[dict], visa_type: str, window_start: date, window_end: date, breaks: Optional[list[dict]] = None) -> dict:
    """Summarise a rolling window. Hours on dates inside a break do not count toward the cap."""
    breaks = breaks or []
    counted_shifts = [shift for shift in shifts if find_break(date.fromisoformat(shift["date"]), breaks) is None]
    break_shifts = [shift for shift in shifts if find_break(date.fromisoformat(shift["date"]), breaks) is not None]
    current_hours = sum_hours(counted_shifts)
    limit = get_visa_limit(visa_type)
    unlimited = limit is None
    return {
        "windowStart": window_start,
        "windowEnd": window_end,
        "currentHours": float(current_hours),
        "remainingHours": None if unlimited else float(max(limit - current_hours, Decimal("0")).quantize(Decimal("0.01"))),
        "limitHours": None if unlimited else float(limit),
        "status": get_usage_status(current_hours, limit),
        "unlimited": unlimited,
        "dailyHours": build_daily_hours(shifts, window_start, window_end, breaks),
        "breakHours": float(sum_hours(break_shifts)),
        "employerHours": build_employer_hours(counted_shifts),
    }


def format_day(value: str) -> str:
    day = date.fromisoformat(value)
    return f"{day.day} {day.strftime('%b %Y')}"


def break_reason(period: dict, counted_total: float) -> str:
    name = f'"{period["label"]}"' if period.get("label") else "a study break"
    return (
        f"This shift falls inside {name} ({format_day(period['startDate'])} to {format_day(period['endDate'])}), "
        "so its hours are not counted toward the fortnightly cap: work during official course breaks is not limited. "
        f"Your counted rolling 14-day total stays at {counted_total} hours."
    )


def require_profile(user_id: str) -> dict:
    profile = crud.get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Complete your profile before checking your hours.")
    return profile


@router.get("/visa-types", response_model=list[VisaTypeOption])
async def get_visa_types():
    return [VisaTypeOption(label=label, limitHours=None if limit is None else float(limit)) for label, limit in VISA_LIMITS.items()]


@router.get("/profile", response_model=Optional[ProfileResponse])
async def get_profile(access_token: str = Depends(require_bearer_token)):
    user_id = await get_user_id_from_token(access_token)
    profile = crud.get_profile(user_id)
    return ProfileResponse(**profile) if profile else None


@router.put("/profile", response_model=ProfileResponse)
async def save_profile(request: ProfilePayload, access_token: str = Depends(require_bearer_token)):
    if request.studyPeriodEnd < request.studyPeriodStart:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Study period end must be on or after the start date.")

    user_id = await get_user_id_from_token(access_token)
    profile = crud.upsert_profile(
        user_id=user_id,
        visa_type=request.visaType,
        study_period_start=request.studyPeriodStart,
        study_period_end=request.studyPeriodEnd,
    )
    return ProfileResponse(**profile)


@router.get("/shifts", response_model=list[ShiftResponse])
async def get_shifts(access_token: str = Depends(require_bearer_token)):
    user_id = await get_user_id_from_token(access_token)
    return [ShiftResponse(**shift) for shift in crud.get_shifts(user_id)]


@router.post("/shifts", response_model=ShiftResponse, status_code=status.HTTP_201_CREATED)
async def create_shift(request: ShiftPayload, access_token: str = Depends(require_bearer_token)):
    user_id = await get_user_id_from_token(access_token)
    hours = calculate_duration(request.startTime, request.endTime)
    shift = crud.create_shift(
        user_id=user_id,
        shift_date=request.date,
        start_time=request.startTime,
        end_time=request.endTime,
        hours=hours,
        employer=request.employer,
    )
    return ShiftResponse(**shift)


@router.delete("/shifts/{shift_id}")
async def delete_shift(shift_id: UUID, access_token: str = Depends(require_bearer_token)):
    user_id = await get_user_id_from_token(access_token)
    if not crud.delete_shift(user_id, shift_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    return {"message": "Shift deleted successfully"}


@router.delete("/shifts")
async def clear_shifts(access_token: str = Depends(require_bearer_token)):
    user_id = await get_user_id_from_token(access_token)
    deleted_count = crud.clear_shifts(user_id)
    return {"message": "Shifts cleared successfully", "deletedCount": deleted_count}


@router.get("/breaks", response_model=list[BreakResponse])
async def get_breaks(access_token: str = Depends(require_bearer_token)):
    user_id = await get_user_id_from_token(access_token)
    return [BreakResponse(**period) for period in crud.get_breaks(user_id)]


@router.post("/breaks", response_model=BreakResponse, status_code=status.HTTP_201_CREATED)
async def create_break(request: BreakPayload, access_token: str = Depends(require_bearer_token)):
    if request.endDate < request.startDate:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Break end date must be on or after the start date.")
    user_id = await get_user_id_from_token(access_token)
    period = crud.create_break(user_id=user_id, label=request.label, start_date=request.startDate, end_date=request.endDate)
    return BreakResponse(**period)


@router.delete("/breaks/{break_id}")
async def delete_break(break_id: UUID, access_token: str = Depends(require_bearer_token)):
    user_id = await get_user_id_from_token(access_token)
    if not crud.delete_break(user_id, break_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Break not found")
    return {"message": "Break deleted successfully"}


@router.get("/home-summary", response_model=HomeSummaryResponse)
async def get_home_summary(today: Optional[date] = None, access_token: str = Depends(require_bearer_token)):
    # The client sends its local date: the server runs in UTC, which lags Australian dates by up to 11 hours.
    user_id = await get_user_id_from_token(access_token)
    profile = require_profile(user_id)
    window_end = today or date.today()
    window_start = window_end - timedelta(days=13)
    shifts = crud.get_shifts_in_window(user_id, window_start, window_end)
    breaks = crud.get_breaks_overlapping(user_id, window_start, window_end)
    summary = build_usage_summary(shifts, profile["visaType"], window_start, window_end, breaks)
    summary["todayInBreak"] = find_break(window_end, breaks) is not None
    summary["recentShifts"] = [ShiftResponse(**shift) for shift in reversed(crud.get_shifts(user_id)[-5:])]
    return HomeSummaryResponse(**summary)


@router.post("/shift-check", response_model=ShiftCheckResponse)
async def check_shift(request: ShiftPayload, access_token: str = Depends(require_bearer_token)):
    user_id = await get_user_id_from_token(access_token)
    profile = require_profile(user_id)
    proposed_hours = calculate_duration(request.startTime, request.endTime)

    window_start = request.date - timedelta(days=13)
    shifts = crud.get_shifts_in_window(user_id, window_start, request.date)
    breaks = crud.get_breaks_overlapping(user_id, window_start, request.date)
    current_summary = build_usage_summary(shifts, profile["visaType"], window_start, request.date, breaks)
    proposed_shift = {"date": request.date.isoformat(), "hours": float(proposed_hours), "employer": request.employer}
    projected_summary = build_usage_summary([*shifts, proposed_shift], profile["visaType"], window_start, request.date, breaks)
    projected_total = projected_summary["currentHours"]
    limit = get_visa_limit(profile["visaType"])
    containing_break = find_break(request.date, breaks)
    # A shift inside a break adds nothing to the counted total, so it can always be taken.
    safe = containing_break is not None or projected_summary["status"] != "over"
    if containing_break is not None:
        reason = break_reason(containing_break, projected_total)
    elif limit is None:
        reason = NO_CAP_MESSAGE
    elif safe:
        reason = f"Your projected rolling 14-day total is {projected_total} hours, within the {float(limit)}-hour limit."
    else:
        over_by = float((Decimal(str(projected_total)) - limit).quantize(Decimal("0.01")))
        reason = f"Your projected rolling 14-day total is {projected_total} hours, which is {over_by} hours over the {float(limit)}-hour limit."

    return ShiftCheckResponse(
        safe=safe,
        currentHours=current_summary["currentHours"],
        projectedHours=projected_total,
        reason=reason,
        status=projected_summary["status"],
        remainingHours=projected_summary["remainingHours"],
        limitHours=projected_summary["limitHours"],
        unlimited=projected_summary["unlimited"],
        windowStart=window_start,
        windowEnd=request.date,
        dailyHours=projected_summary["dailyHours"],
        breakHours=projected_summary["breakHours"],
        proposedShiftInBreak=containing_break is not None,
    )