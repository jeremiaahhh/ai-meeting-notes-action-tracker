SAMPLE_TRANSCRIPT = """
Anna: Today we need to finalize the launch plan.
Marc: We decided to ship on July 15. Marketing will prepare the launch post by Friday.
Anna: Action item: Marc will draft the announcement by next Monday.
Sam: We still don't know how to handle EU pricing.
Anna: We agreed to keep the legacy export endpoint until Q4.
"""


def _create_meeting(client, **overrides):
    body = {
        "title": "Q3 Launch Planning",
        "participants": "Anna, Marc, Sam",
        "transcript": SAMPLE_TRANSCRIPT,
    }
    body.update(overrides)
    response = client.post("/meetings", json=body)
    assert response.status_code == 201, response.text
    return response.json()


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["mock_mode"] is True


def test_create_and_list_meetings(client):
    created = _create_meeting(client)
    assert created["title"] == "Q3 Launch Planning"
    assert created["status"] == "draft"

    listing = client.get("/meetings").json()
    assert len(listing) == 1
    assert listing[0]["id"] == created["id"]
    assert listing[0]["has_notes"] is False


def test_generate_notes_flow(client):
    created = _create_meeting(client)
    response = client.post(f"/meetings/{created['id']}/generate-notes")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ready"
    assert body["notes"] is not None
    assert body["notes"]["used_mock"] is True
    assert body["notes"]["confidence"] > 0
    assert len(body["action_items"]) >= 1


def test_action_item_status_can_be_updated(client):
    created = _create_meeting(client)
    client.post(f"/meetings/{created['id']}/generate-notes")
    detail = client.get(f"/meetings/{created['id']}").json()
    item_id = detail["action_items"][0]["id"]

    r = client.patch(f"/action-items/{item_id}", json={"status": "completed"})
    assert r.status_code == 200
    assert r.json()["status"] == "completed"


def test_export_returns_markdown(client):
    created = _create_meeting(client)
    client.post(f"/meetings/{created['id']}/generate-notes")
    r = client.get(f"/meetings/{created['id']}/export")
    assert r.status_code == 200
    body = r.json()
    assert body["filename"].endswith(".md")
    assert "# Q3 Launch Planning" in body["markdown"]
    assert "## Action Items" in body["markdown"]


def test_delete_meeting(client):
    created = _create_meeting(client)
    r = client.delete(f"/meetings/{created['id']}")
    assert r.status_code == 204
    assert client.get(f"/meetings/{created['id']}").status_code == 404


def test_generate_notes_requires_transcript(client):
    created = _create_meeting(client, transcript="")
    r = client.post(f"/meetings/{created['id']}/generate-notes")
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "validation_error"


def test_search_filters_meetings(client):
    _create_meeting(client, title="Q3 Launch Planning")
    _create_meeting(client, title="Engineering Standup", transcript="standup notes only")
    r = client.get("/meetings", params={"search": "standup"})
    assert r.status_code == 200
    titles = [m["title"] for m in r.json()]
    assert titles == ["Engineering Standup"]
