"""Profile, password-change and account-deletion tests."""

from __future__ import annotations


def test_profile_update(client, auth):
    response = client.patch(
        "/api/auth/me", json={"display_name": "  Анна   Мария  "}, headers=auth["headers"]
    )
    assert response.status_code == 200
    assert response.json()["display_name"] == "Анна Мария"


def test_password_change_invalidates_old_token(client, auth):
    old_token = auth["headers"]["Authorization"].split()[-1]
    response = client.post(
        "/api/auth/password",
        json={"current_password": "FocusPass123", "new_password": "NewFocusPass456"},
        headers=auth["headers"],
    )
    assert response.status_code == 200, response.text
    new_token = response.json()["access_token"]
    assert new_token != old_token

    assert client.get("/api/tasks", headers=auth["headers"]).status_code == 401
    assert (
        client.get(
            "/api/tasks", headers={"Authorization": f"Bearer {new_token}"}
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/api/auth/login",
            json={"email": "student@example.com", "password": "NewFocusPass456"},
        ).status_code
        == 200
    )


def test_delete_account_cascades(client, auth, db):
    created = client.post(
        "/api/tasks", json={"title": "Удалить вместе с аккаунтом"}, headers=auth["headers"]
    )
    assert created.status_code == 201

    wrong = client.request(
        "DELETE", "/api/auth/account", json={"password": "nope"}, headers=auth["headers"]
    )
    assert wrong.status_code == 400

    removed = client.request(
        "DELETE",
        "/api/auth/account",
        json={"password": "FocusPass123"},
        headers=auth["headers"],
    )
    assert removed.status_code == 204
    assert (
        client.post(
            "/api/auth/login",
            json={"email": "student@example.com", "password": "FocusPass123"},
        ).status_code
        == 401
    )
