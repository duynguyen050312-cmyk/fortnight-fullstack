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
        "employer": row[5],
    }


def _break_from_row(row) -> dict:
    return {
        "id": str(row[0]),
        "label": row[1],
        "startDate": row[2].isoformat(),
        "endDate": row[3].isoformat(),
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
                SELECT id, shift_date, start_time, end_time, hours, employer
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
                SELECT id, shift_date, start_time, end_time, hours, employer
                FROM public.shifts
                WHERE user_id = %s AND shift_date BETWEEN %s AND %s
                ORDER BY shift_date, start_time, id
                """,
                (user_id, start_date, end_date),
            )
            return [_shift_from_row(row) for row in cur.fetchall()]
    finally:
        conn.close()


def create_shift(user_id: str, shift_date: date, start_time: time, end_time: time, hours: Decimal, employer: Optional[str] = None) -> dict:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO public.shifts (user_id, shift_date, start_time, end_time, hours, employer)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, shift_date, start_time, end_time, hours, employer
                """,
                (user_id, shift_date, start_time, end_time, hours, employer),
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


def get_breaks(user_id: str) -> list[dict]:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, label, start_date, end_date
                FROM public.breaks
                WHERE user_id = %s
                ORDER BY start_date, end_date, id
                """,
                (user_id,),
            )
            return [_break_from_row(row) for row in cur.fetchall()]
    finally:
        conn.close()


def get_breaks_overlapping(user_id: str, start_date: date, end_date: date) -> list[dict]:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, label, start_date, end_date
                FROM public.breaks
                WHERE user_id = %s AND start_date <= %s AND end_date >= %s
                ORDER BY start_date, end_date, id
                """,
                (user_id, end_date, start_date),
            )
            return [_break_from_row(row) for row in cur.fetchall()]
    finally:
        conn.close()


def create_break(user_id: str, label: Optional[str], start_date: date, end_date: date) -> dict:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO public.breaks (user_id, label, start_date, end_date)
                VALUES (%s, %s, %s, %s)
                RETURNING id, label, start_date, end_date
                """,
                (user_id, label, start_date, end_date),
            )
            created = _break_from_row(cur.fetchone())
            conn.commit()
            return created
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def delete_break(user_id: str, break_id: UUID) -> bool:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM public.breaks WHERE id = %s AND user_id = %s",
                (str(break_id), user_id),
            )
            deleted = cur.rowcount > 0
            conn.commit()
            return deleted
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
