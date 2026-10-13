"""Authenticated Fortnight profile, shift, and compliance-check endpoints."""

from datetime import date, time, timedelta
from decimal import Decimal
from typing import Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

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

router = APIRouter(prefix="/api", tags=["Fortnight"])


class ProfilePayload(BaseModel):
    visaType: str
    studyPeriodStart: date
    studyPeriodEnd: date


class ProfileResponse(ProfilePayload):
    pass


class ShiftPayload(BaseModel):
    date: date
    startTime: time
    endTime: time


class ShiftResponse(ShiftPayload):
    id: str
    hours: float


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


class VisaTypeOption(BaseModel):
    label: str
    limitHours: Optional[float]


class DailyHours(BaseModel):
    date: date
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


def build_daily_hours(shifts: list[dict], window_start: date, window_end: date) -> list[DailyHours]:
    totals = {window_start + timedelta(days=offset): Decimal("0") for offset in range(14)}
    for shift in shifts:
        shift_date = date.fromisoformat(shift["date"])
        if shift_date in totals:
            totals[shift_date] += Decimal(str(shift["hours"]))
    return [DailyHours(date=day, hours=float(hours.quantize(Decimal("0.01")))) for day, hours in totals.items()]


def build_usage_summary(shifts: list[dict], visa_type: str, window_start: date, window_end: date) -> dict:
    current_hours = sum((Decimal(str(shift["hours"])) for shift in shifts), Decimal("0"))
    current_hours = current_hours.quantize(Decimal("0.01"))
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
        "dailyHours": build_daily_hours(shifts, window_start, window_end),
    }


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


@router.get("/home-summary", response_model=HomeSummaryResponse)
async def get_home_summary(today: Optional[date] = None, access_token: str = Depends(require_bearer_token)):
    # The client sends its local date: the server runs in UTC, which lags Australian dates by up to 11 hours.
    user_id = await get_user_id_from_token(access_token)
    profile = require_profile(user_id)
    window_end = today or date.today()
    window_start = window_end - timedelta(days=13)
    shifts = crud.get_shifts_in_window(user_id, window_start, window_end)
    summary = build_usage_summary(shifts, profile["visaType"], window_start, window_end)
    summary["recentShifts"] = [ShiftResponse(**shift) for shift in reversed(crud.get_shifts(user_id)[-5:])]
    return HomeSummaryResponse(**summary)


@router.post("/shift-check", response_model=ShiftCheckResponse)
async def check_shift(request: ShiftPayload, access_token: str = Depends(require_bearer_token)):
    user_id = await get_user_id_from_token(access_token)
    profile = require_profile(user_id)
    proposed_hours = calculate_duration(request.startTime, request.endTime)

    window_start = request.date - timedelta(days=13)
    shifts = crud.get_shifts_in_window(user_id, window_start, request.date)
    current_summary = build_usage_summary(shifts, profile["visaType"], window_start, request.date)
    proposed_shift = {"date": request.date.isoformat(), "hours": float(proposed_hours)}
    projected_summary = build_usage_summary([*shifts, proposed_shift], profile["visaType"], window_start, request.date)
    projected_total = projected_summary["currentHours"]
    limit = get_visa_limit(profile["visaType"])
    safe = projected_summary["status"] != "over"
    if limit is None:
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
    )