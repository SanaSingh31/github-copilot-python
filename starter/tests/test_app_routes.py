import copy

import pytest

from app import CURRENT, app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as test_client:
        yield test_client


def test_home_route_renders_index_page(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.mimetype == "text/html"
    assert b"<html" in response.data.lower()


def test_new_game_route_returns_9x9_puzzle_json(client):
    response = client.get("/new?clues=35")

    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, dict)
    assert "puzzle" in data

    board = data["puzzle"]
    assert isinstance(board, list)
    assert len(board) == 9
    assert all(len(row) == 9 for row in board)
    assert sum(cell != 0 for row in board for cell in row) == 35
    assert CURRENT["puzzle"] == board
    assert CURRENT["solution"] is not None


def test_check_solution_route_accepts_correct_board_and_reports_incorrect_cells(client):
    client.get("/new?clues=35")
    solution = copy.deepcopy(CURRENT["solution"])

    correct_response = client.post("/check", json={"board": solution})
    assert correct_response.status_code == 200
    assert correct_response.get_json()["incorrect"] == []

    wrong_board = copy.deepcopy(solution)
    wrong_board[0][0] = 9 if solution[0][0] != 9 else 8
    incorrect_response = client.post("/check", json={"board": wrong_board})
    assert incorrect_response.status_code == 200
    assert [0, 0] in incorrect_response.get_json()["incorrect"]


def test_check_solution_route_requires_active_game(client):
    CURRENT["solution"] = None

    response = client.post("/check", json={"board": [[0] * 9 for _ in range(9)]})

    assert response.status_code == 400
    assert response.get_json()["error"] == "No game in progress"
