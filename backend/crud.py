"""User-scoped PostgreSQL operations for Fortnight profiles and shifts."""

from datetime import date, time
from decimal import Decimal
from typing import Optional
from uuid import UUID

from database import get_connection


def _profile_from_row(row) -> dict:
    return {
        "visaType": row[0],
        "studyPeriodStart": row[1].isoformat(),
        "studyPeriodEnd": row[2].isoformat(),
    }


def _shift_from_row(row) -> dict:
    return {
        "id": str(row[0]),
        "date": row[1].isoformat(),
        "startTime": row[2].strftime("%H:%M"),
        "endTime": row[3].strftime("%H:%M"),
        "hours": float(row[4]),
    }


def get_profile(user_id: str) -> Optional[dict]:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT visa_type, study_period_start, study_period_end
                FROM public.profiles
                WHERE user_id = %s
                """,
                (user_id,),
            )
            row = cur.fetchone()
            return _profile_from_row(row) if row else None
    finally:
        conn.close()


def upsert_profile(user_id: str, visa_type: str, study_period_start: date, study_period_end: date) -> dict:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO public.profiles (user_id, visa_type, study_period_start, study_period_end)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (user_id) DO UPDATE SET
                    visa_type = EXCLUDED.visa_type,
                    study_period_start = EXCLUDED.study_period_start,
                    study_period_end = EXCLUDED.study_period_end
                RETURNING visa_type, study_period_start, study_period_end
                """,
                (user_id, visa_type, study_period_start, study_period_end),
            )
            profile = _profile_from_row(cur.fetchone())
            conn.commit()
            return profile
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def get_shifts(user_id: str) -> list[dict]:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, shift_date, start_time, end_time, hours
                FROM public.shifts
                WHERE user_id = %s
                ORDER BY shift_date, start_time, id
                """,
                (user_id,),
            )
            return [_shift_from_row(row) for row in cur.fetchall()]
    finally:
        conn.close()


def get_shifts_in_window(user_id: str, start_date: date, end_date: date) -> list[dict]:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, shift_date, start_time, end_time, hours
                FROM public.shifts
                WHERE user_id = %s AND shift_date BETWEEN %s AND %s
                ORDER BY shift_date, start_time, id
                """,
                (user_id, start_date, end_date),
            )
            return [_shift_from_row(row) for row in cur.fetchall()]
    finally:
        conn.close()


def create_shift(user_id: str, shift_date: date, start_time: time, end_time: time, hours: Decimal) -> dict:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO public.shifts (user_id, shift_date, start_time, end_time, hours)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, shift_date, start_time, end_time, hours
                """,
                (user_id, shift_date, start_time, end_time, hours),
            )
            shift = _shift_from_row(cur.fetchone())
            conn.commit()
            return shift
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def delete_shift(user_id: str, shift_id: UUID) -> bool:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM public.shifts WHERE id = %s AND user_id = %s",
                (str(shift_id), user_id),
            )
            deleted = cur.rowcount > 0
            conn.commit()
            return deleted
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def clear_shifts(user_id: str) -> int:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM public.shifts WHERE user_id = %s", (user_id,))
            deleted_count = cur.rowcount
            conn.commit()
            return deleted_count
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()