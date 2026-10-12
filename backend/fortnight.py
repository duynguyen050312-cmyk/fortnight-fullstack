"""Authenticated Fortnight profile, shift, and compliance-check endpoints."""

from datetime import date, time, timedelta
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

import crud
from auth import get_user_from_supabase, require_bearer_token


MAX_FORTNIGHT_HOURS = Decimal("48")
MAX_SHIFT_HOURS = Decimal("16")

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


@router.post("/shift-check", response_model=ShiftCheckResponse)
async def check_shift(request: ShiftPayload, access_token: str = Depends(require_bearer_token)):
    user_id = await get_user_id_from_token(access_token)
    proposed_hours = calculate_duration(request.startTime, request.endTime)

    window_start = request.date - timedelta(days=13)
    current_hours = sum(
        (Decimal(str(shift["hours"])) for shift in crud.get_shifts_in_window(user_id, window_start, request.date)),
        Decimal("0"),
    )
    projected_hours = current_hours + proposed_hours
    safe = projected_hours <= MAX_FORTNIGHT_HOURS

    current_total = float(current_hours.quantize(Decimal("0.01")))
    projected_total = float(projected_hours.quantize(Decimal("0.01")))
    if safe:
        reason = f"Your projected rolling 14-day total is {projected_total} hours, within the 48-hour limit."
    else:
        over_by = float((projected_hours - MAX_FORTNIGHT_HOURS).quantize(Decimal("0.01")))
        reason = f"Your projected rolling 14-day total is {projected_total} hours, which is {over_by} hours over the 48-hour limit."

    return ShiftCheckResponse(
        safe=safe,
        currentHours=current_total,
        projectedHours=projected_total,
        reason=reason,
    )