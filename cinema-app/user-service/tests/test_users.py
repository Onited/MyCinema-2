"""
Comprehensive security & functional tests for User endpoints.

Coverage per route:
  - ✅ Success case
  - ❌ Error / edge cases
  - 🔒 Auth enforcement
  - 💉 Injection prevention
  - 🔁 Duplicate prevention
"""

import pytest
from httpx import AsyncClient

# ============================================================================
# Helpers
# ============================================================================
TEST_USER = {
    "email": "john@cinema.com",
    "password": "SuperSecret123!",
    "full_name": "John Doe",
}


async def register_user(client: AsyncClient, user: dict | None = None):
    """Register a user and return the response."""
    payload = user or TEST_USER
    return await client.post("/api/v1/users/register", json=payload)


async def login_user(client: AsyncClient, email: str | None = None, password: str | None = None):
    """Login via OAuth2 form and return the response."""
    return await client.post(
        "/api/v1/users/login",
        data={
            "username": email or TEST_USER["email"],
            "password": password or TEST_USER["password"],
        },
    )


async def get_auth_header(client: AsyncClient, user: dict | None = None) -> dict:
    """Register + login a user and return the Authorization header."""
    u = user or TEST_USER
    await register_user(client, user=u)
    resp = await login_user(client, email=u["email"], password=u["password"])
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ============================================================================
# 🏥 Health Check
# ============================================================================
@pytest.mark.asyncio
async def test_health_returns_ok(client: AsyncClient):
    """GET /health → 200 with status ok."""
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


# ============================================================================
# 📝 POST /register – Success Cases
# ============================================================================
@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    """Register a valid user → 201, no password in response."""
    resp = await register_user(client)
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == TEST_USER["email"]
    assert data["full_name"] == TEST_USER["full_name"]
    assert data["is_active"] is True
    assert "hashed_password" not in data
    assert "password" not in data


# ============================================================================
# 📝 POST /register – Error & Security Cases
# ============================================================================
@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """Duplicate email → 400."""
    await register_user(client)
    resp = await register_user(client)
    assert resp.status_code == 400
    assert "already registered" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_invalid_email(client: AsyncClient):
    """Malformed email → 422 validation error."""
    resp = await register_user(client, user={
        "email": "not-an-email",
        "password": "ValidPass1!",
        "full_name": "Test",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_password_too_short(client: AsyncClient):
    """Password < 8 chars → 422."""
    resp = await register_user(client, user={
        "email": "short@cinema.com",
        "password": "Ab1!",
        "full_name": "Short Pw",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_password_no_uppercase(client: AsyncClient):
    """Password without uppercase → 422."""
    resp = await register_user(client, user={
        "email": "noup@cinema.com",
        "password": "alllowercase1!",
        "full_name": "No Upper",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_password_no_lowercase(client: AsyncClient):
    """Password without lowercase → 422."""
    resp = await register_user(client, user={
        "email": "nolow@cinema.com",
        "password": "ALLUPPERCASE1!",
        "full_name": "No Lower",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_password_no_digit(client: AsyncClient):
    """Password without digit → 422."""
    resp = await register_user(client, user={
        "email": "nodigit@cinema.com",
        "password": "NoDigitHere!",
        "full_name": "No Digit",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_empty_name(client: AsyncClient):
    """Empty full_name → 422."""
    resp = await register_user(client, user={
        "email": "empty@cinema.com",
        "password": "ValidPass1!",
        "full_name": "",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_whitespace_only_name(client: AsyncClient):
    """Whitespace-only full_name → 422."""
    resp = await register_user(client, user={
        "email": "spaces@cinema.com",
        "password": "ValidPass1!",
        "full_name": "   ",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_missing_fields(client: AsyncClient):
    """Missing required fields → 422."""
    resp = await client.post("/api/v1/users/register", json={})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_extra_fields_ignored(client: AsyncClient):
    """Extra fields like 'is_admin' should be ignored, not persisted."""
    resp = await register_user(client, user={
        "email": "extra@cinema.com",
        "password": "ValidPass1!",
        "full_name": "Extra Fields",
        "is_admin": True,
        "role": "superadmin",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "is_admin" not in data
    assert "role" not in data


# ============================================================================
# 💉 POST /register – Injection Prevention
# ============================================================================
@pytest.mark.asyncio
async def test_register_sql_injection_email(client: AsyncClient):
    """SQL injection in email field → rejected by EmailStr validation (422)."""
    resp = await register_user(client, user={
        "email": "'; DROP TABLE users;--@evil.com",
        "password": "ValidPass1!",
        "full_name": "SQL Injector",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_sql_injection_name(client: AsyncClient):
    """SQL injection in name field → accepted but safely parameterized (no crash)."""
    resp = await register_user(client, user={
        "email": "sqli_name@cinema.com",
        "password": "ValidPass1!",
        "full_name": "'; DROP TABLE users;--",
    })
    assert resp.status_code == 201
    assert resp.json()["full_name"] == "'; DROP TABLE users;--"


@pytest.mark.asyncio
async def test_register_xss_in_name(client: AsyncClient):
    """XSS payload in name → stored as-is (no execution), no crash."""
    resp = await register_user(client, user={
        "email": "xss@cinema.com",
        "password": "ValidPass1!",
        "full_name": "<script>alert('xss')</script>",
    })
    assert resp.status_code == 201
    assert resp.json()["full_name"] == "<script>alert('xss')</script>"


@pytest.mark.asyncio
async def test_register_nosql_injection_attempt(client: AsyncClient):
    """NoSQL-style injection object → rejected (422 expects string)."""
    resp = await client.post("/api/v1/users/register", json={
        "email": "nosql@cinema.com",
        "password": "ValidPass1!",
        "full_name": {"$gt": ""},
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_oversized_payload(client: AsyncClient):
    """Extremely long password (>128 chars) → 422."""
    resp = await register_user(client, user={
        "email": "bigpw@cinema.com",
        "password": "A" * 200 + "a1",
        "full_name": "Big Password",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_oversized_name(client: AsyncClient):
    """Extremely long name (>255 chars) → 422."""
    resp = await register_user(client, user={
        "email": "bigname@cinema.com",
        "password": "ValidPass1!",
        "full_name": "A" * 300,
    })
    assert resp.status_code == 422


# ============================================================================
# 🔑 POST /login – Success Cases
# ============================================================================
@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """Valid credentials → 200 + JWT token."""
    await register_user(client)
    resp = await login_user(client)
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 0


# ============================================================================
# 🔑 POST /login – Error Cases
# ============================================================================
@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    """Wrong password → 401."""
    await register_user(client)
    resp = await login_user(client, password="WrongPassword1!")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    """Unknown email → 401 (same message as wrong pw to avoid enumeration)."""
    resp = await login_user(client, email="nobody@cinema.com")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_empty_credentials(client: AsyncClient):
    """Empty email/password → 422."""
    resp = await client.post("/api/v1/users/login", data={"username": "", "password": ""})
    assert resp.status_code in (401, 422)


@pytest.mark.asyncio
async def test_login_sql_injection_username(client: AsyncClient):
    """SQL injection in login username → 401, no crash."""
    resp = await login_user(client, email="' OR '1'='1")
    assert resp.status_code in (401, 422)


# ============================================================================
# 👤 GET /me – Success Cases
# ============================================================================
@pytest.mark.asyncio
async def test_get_me_authenticated(client: AsyncClient):
    """Valid JWT → 200 with user profile (no password)."""
    headers = await get_auth_header(client)
    resp = await client.get("/api/v1/users/me", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == TEST_USER["email"]
    assert "hashed_password" not in data
    assert "password" not in data


# ============================================================================
# 👤 GET /me – Auth Enforcement
# ============================================================================
@pytest.mark.asyncio
async def test_get_me_no_token(client: AsyncClient):
    """No token → 401."""
    resp = await client.get("/api/v1/users/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me_invalid_token(client: AsyncClient):
    """Garbage token → 401."""
    headers = {"Authorization": "Bearer this.is.not.a.valid.jwt"}
    resp = await client.get("/api/v1/users/me", headers=headers)
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me_expired_token(client: AsyncClient):
    """Manually craft an expired token → 401."""
    from datetime import timedelta
    from app.core.security import create_access_token

    expired_token = create_access_token(
        data={"sub": "999"},
        expires_delta=timedelta(hours=-1),
    )
    headers = {"Authorization": f"Bearer {expired_token}"}
    resp = await client.get("/api/v1/users/me", headers=headers)
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me_token_with_nonexistent_user_id(client: AsyncClient):
    """Token with valid signature but user_id that doesn't exist → 401."""
    from app.core.security import create_access_token

    token = create_access_token(data={"sub": "99999"})
    headers = {"Authorization": f"Bearer {token}"}
    resp = await client.get("/api/v1/users/me", headers=headers)
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me_token_missing_sub_claim(client: AsyncClient):
    """Token without 'sub' claim → 401."""
    from app.core.security import create_access_token

    token = create_access_token(data={"role": "admin"})
    headers = {"Authorization": f"Bearer {token}"}
    resp = await client.get("/api/v1/users/me", headers=headers)
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me_wrong_auth_scheme(client: AsyncClient):
    """Basic auth instead of Bearer → 401."""
    headers = {"Authorization": "Basic dXNlcjpwYXNz"}
    resp = await client.get("/api/v1/users/me", headers=headers)
    assert resp.status_code == 401


# ============================================================================
# ✏️ PUT /me – Success Cases
# ============================================================================
@pytest.mark.asyncio
async def test_update_me_name(client: AsyncClient):
    """Update full_name → 200 with new name."""
    headers = await get_auth_header(client)
    resp = await client.put(
        "/api/v1/users/me",
        json={"full_name": "Jane Doe"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Jane Doe"


@pytest.mark.asyncio
async def test_update_me_email(client: AsyncClient):
    """Update email → 200 with new email."""
    user = {"email": "update_email@cinema.com", "password": "ValidPass1!", "full_name": "Updater"}
    headers = await get_auth_header(client, user=user)
    resp = await client.put(
        "/api/v1/users/me",
        json={"email": "new_email@cinema.com"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["email"] == "new_email@cinema.com"


# ============================================================================
# ✏️ PUT /me – Error & Security Cases
# ============================================================================
@pytest.mark.asyncio
async def test_update_me_no_token(client: AsyncClient):
    """PUT /me without token → 401."""
    resp = await client.put("/api/v1/users/me", json={"full_name": "Hacker"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_update_me_duplicate_email(client: AsyncClient):
    """Update email to one already taken → 400."""
    user_a = {"email": "usera@cinema.com", "password": "ValidPass1!", "full_name": "User A"}
    user_b = {"email": "userb@cinema.com", "password": "ValidPass1!", "full_name": "User B"}
    await register_user(client, user=user_a)
    headers_b = await get_auth_header(client, user=user_b)
    resp = await client.put(
        "/api/v1/users/me",
        json={"email": "usera@cinema.com"},
        headers=headers_b,
    )
    assert resp.status_code == 400
    assert "already in use" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_me_invalid_email(client: AsyncClient):
    """Update with malformed email → 422."""
    headers = await get_auth_header(client)
    resp = await client.put(
        "/api/v1/users/me",
        json={"email": "not-valid-email"},
        headers=headers,
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_update_me_empty_name(client: AsyncClient):
    """Update with empty name → 422."""
    headers = await get_auth_header(client)
    resp = await client.put(
        "/api/v1/users/me",
        json={"full_name": ""},
        headers=headers,
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_update_me_sql_injection_name(client: AsyncClient):
    """SQL injection in update name → stored safely, no crash."""
    user = {"email": "update_sqli@cinema.com", "password": "ValidPass1!", "full_name": "Safe"}
    headers = await get_auth_header(client, user=user)
    resp = await client.put(
        "/api/v1/users/me",
        json={"full_name": "'; DROP TABLE users;--"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "'; DROP TABLE users;--"


# ============================================================================
# 🗑️ DELETE /me – Success Cases
# ============================================================================
@pytest.mark.asyncio
async def test_delete_me_success(client: AsyncClient):
    """DELETE /me → 200, then token is invalid."""
    user = {"email": "delete_me@cinema.com", "password": "DeleteMe1!", "full_name": "Delete Me"}
    headers = await get_auth_header(client, user=user)

    resp = await client.delete("/api/v1/users/me", headers=headers)
    assert resp.status_code == 200
    assert "deleted" in resp.json()["detail"].lower()

    resp = await client.get("/api/v1/users/me", headers=headers)
    assert resp.status_code == 401


# ============================================================================
# 🗑️ DELETE /me – Auth Enforcement
# ============================================================================
@pytest.mark.asyncio
async def test_delete_me_no_token(client: AsyncClient):
    """DELETE /me without token → 401."""
    resp = await client.delete("/api/v1/users/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_delete_me_invalid_token(client: AsyncClient):
    """DELETE /me with garbage token → 401."""
    headers = {"Authorization": "Bearer fake.token.here"}
    resp = await client.delete("/api/v1/users/me", headers=headers)
    assert resp.status_code == 401


# ============================================================================
# 🔁 Uniqueness & Isolation
# ============================================================================
@pytest.mark.asyncio
async def test_users_cannot_see_each_other(client: AsyncClient):
    """Each user's /me returns only their own data, not another user's."""
    user_a = {"email": "alice@cinema.com", "password": "AlicePass1!", "full_name": "Alice"}
    user_b = {"email": "bob@cinema.com", "password": "BobbyPass1!", "full_name": "Bob"}
    headers_a = await get_auth_header(client, user=user_a)
    headers_b = await get_auth_header(client, user=user_b)

    resp_a = await client.get("/api/v1/users/me", headers=headers_a)
    resp_b = await client.get("/api/v1/users/me", headers=headers_b)
    assert resp_a.json()["email"] == "alice@cinema.com"
    assert resp_b.json()["email"] == "bob@cinema.com"
    assert resp_a.json()["id"] != resp_b.json()["id"]


@pytest.mark.asyncio
async def test_case_sensitivity_email_duplicate(client: AsyncClient):
    """Email duplicates should be caught regardless of case (email is normalized to lowercase)."""
    user = {"email": "CaseDup@Cinema.com", "password": "ValidPass1!", "full_name": "Case Test"}
    await register_user(client, user=user)
    resp = await register_user(client, user={
        "email": "casedup@cinema.com",
        "password": "ValidPass1!",
        "full_name": "Case Test 2",
    })
    assert resp.status_code == 400


# ============================================================================
# 🛡️ Method Not Allowed
# ============================================================================
@pytest.mark.asyncio
async def test_register_get_not_allowed(client: AsyncClient):
    """GET on /register → 405."""
    resp = await client.get("/api/v1/users/register")
    assert resp.status_code == 405


@pytest.mark.asyncio
async def test_login_get_not_allowed(client: AsyncClient):
    """GET on /login → 405."""
    resp = await client.get("/api/v1/users/login")
    assert resp.status_code == 405


@pytest.mark.asyncio
async def test_delete_on_register_not_allowed(client: AsyncClient):
    """DELETE on /register → 405."""
    resp = await client.delete("/api/v1/users/register")
    assert resp.status_code == 405


# ============================================================================
# 🎬 User Types – Registration
# ============================================================================
@pytest.mark.asyncio
async def test_register_default_type_is_standard(client: AsyncClient):
    """Register without user_type → defaults to 'standard'."""
    resp = await register_user(client)
    assert resp.status_code == 201
    assert resp.json()["user_type"] == "standard"
    assert resp.json()["proof_url"] is None


@pytest.mark.asyncio
async def test_register_etudiant(client: AsyncClient):
    """Register as étudiant with proof → 201."""
    resp = await register_user(client, user={
        "email": "etudiant@cinema.com",
        "password": "StudentPass1!",
        "full_name": "Étudiante Marie",
        "user_type": "etudiant",
        "proof_url": "https://storage.example.com/carte_etudiant.jpg",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["user_type"] == "etudiant"
    assert data["proof_url"] == "https://storage.example.com/carte_etudiant.jpg"


@pytest.mark.asyncio
async def test_register_mineur(client: AsyncClient):
    """Register as mineur → 201."""
    resp = await register_user(client, user={
        "email": "mineur@cinema.com",
        "password": "MineurPass1!",
        "full_name": "Jean Junior",
        "user_type": "mineur",
    })
    assert resp.status_code == 201
    assert resp.json()["user_type"] == "mineur"


@pytest.mark.asyncio
async def test_register_chomeur(client: AsyncClient):
    """Register as chômeur → 201."""
    resp = await register_user(client, user={
        "email": "chomeur@cinema.com",
        "password": "ChomeurPass1!",
        "full_name": "Paul Dupont",
        "user_type": "chomeur",
        "proof_url": "https://storage.example.com/attestation.pdf",
    })
    assert resp.status_code == 201
    assert resp.json()["user_type"] == "chomeur"


@pytest.mark.asyncio
async def test_register_invalid_user_type(client: AsyncClient):
    """Register with invalid user_type → 422."""
    resp = await register_user(client, user={
        "email": "invalid_type@cinema.com",
        "password": "ValidPass1!",
        "full_name": "Bad Type",
        "user_type": "vip",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_invalid_proof_url(client: AsyncClient):
    """Register with non-HTTP proof_url → 422."""
    resp = await register_user(client, user={
        "email": "bad_proof@cinema.com",
        "password": "ValidPass1!",
        "full_name": "Bad Proof",
        "user_type": "etudiant",
        "proof_url": "ftp://not-valid.com/file",
    })
    assert resp.status_code == 422


# ============================================================================
# 🎬 User Types – JWT Claims
# ============================================================================
@pytest.mark.asyncio
async def test_login_jwt_contains_type_standard(client: AsyncClient):
    """Login as standard user → JWT contains type='standard'."""
    from app.core.security import decode_access_token

    await register_user(client)
    resp = await login_user(client)
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["type"] == "standard"


@pytest.mark.asyncio
async def test_login_jwt_contains_type_etudiant(client: AsyncClient):
    """Login as étudiant → JWT contains type='etudiant'."""
    from app.core.security import decode_access_token

    user = {
        "email": "jwt_etudiant@cinema.com",
        "password": "StudentPass1!",
        "full_name": "Étudiant JWT",
        "user_type": "etudiant",
    }
    await register_user(client, user=user)
    resp = await login_user(client, email=user["email"], password=user["password"])
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["type"] == "etudiant"


# ============================================================================
# 🎬 User Types – GET /me
# ============================================================================
@pytest.mark.asyncio
async def test_get_me_shows_user_type(client: AsyncClient):
    """GET /me returns user_type and proof_url."""
    user = {
        "email": "me_type@cinema.com",
        "password": "TypePass1!",
        "full_name": "Type Viewer",
        "user_type": "mineur",
    }
    headers = await get_auth_header(client, user=user)
    resp = await client.get("/api/v1/users/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["user_type"] == "mineur"


# ============================================================================
# 🎬 User Types – PUT /me (update type)
# ============================================================================
@pytest.mark.asyncio
async def test_update_me_change_type(client: AsyncClient):
    """PUT /me can change user_type."""
    user = {
        "email": "update_type@cinema.com",
        "password": "UpdateType1!",
        "full_name": "Type Updater",
    }
    headers = await get_auth_header(client, user=user)
    resp = await client.put(
        "/api/v1/users/me",
        json={"user_type": "etudiant", "proof_url": "https://example.com/carte.jpg"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["user_type"] == "etudiant"
    assert resp.json()["proof_url"] == "https://example.com/carte.jpg"


@pytest.mark.asyncio
async def test_update_me_invalid_type(client: AsyncClient):
    """PUT /me with invalid user_type → 422."""
    headers = await get_auth_header(client)
    resp = await client.put(
        "/api/v1/users/me",
        json={"user_type": "vip_gold"},
        headers=headers,
    )
    assert resp.status_code == 422


# ============================================================================
# 🎬 POST /verify-type
# ============================================================================
@pytest.mark.asyncio
async def test_verify_type_success(client: AsyncClient):
    """POST /verify-type with valid proof → updates type."""
    user = {
        "email": "verify@cinema.com",
        "password": "VerifyPass1!",
        "full_name": "Verifier",
    }
    headers = await get_auth_header(client, user=user)
    resp = await client.post(
        "/api/v1/users/verify-type",
        json={"user_type": "chomeur", "proof_url": "https://example.com/attestation.pdf"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["user_type"] == "chomeur"
    assert resp.json()["proof_url"] == "https://example.com/attestation.pdf"


@pytest.mark.asyncio
async def test_verify_type_no_token(client: AsyncClient):
    """POST /verify-type without auth → 401."""
    resp = await client.post(
        "/api/v1/users/verify-type",
        json={"user_type": "etudiant", "proof_url": "https://example.com/carte.jpg"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_verify_type_invalid_proof_url(client: AsyncClient):
    """POST /verify-type with bad URL → 422."""
    user = {
        "email": "bad_verify@cinema.com",
        "password": "BadVerify1!",
        "full_name": "Bad Verifier",
    }
    headers = await get_auth_header(client, user=user)
    resp = await client.post(
        "/api/v1/users/verify-type",
        json={"user_type": "etudiant", "proof_url": "not-a-url"},
        headers=headers,
    )
    assert resp.status_code == 422
