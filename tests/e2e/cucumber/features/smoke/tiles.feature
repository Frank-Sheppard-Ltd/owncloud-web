Feature: Tiles
    As a user
    I want to view and navigate resources displayed as tiles
    So that I can identify them better

    Background:
        Given "Admin" creates following users
            | id    |
            | Alice |

    Scenario: Users can navigate web via tiles
        Given "Admin" creates following users
            | id    |
            | Alice |
        And "Alice" logs in
        And "Alice" opens the "files" app
        And "Alice" creates the following resources
            | resource    | type   |
            | tile_folder | folder |
        And "Alice" switches to the tiles-view
        And "Alice" sees the resources displayed as tiles
        And "Alice" opens folder "tile_folder"
        And "Alice" creates the following resources
            | resource     | type   |
            | tile_folder2 | folder |
        And "Alice" sees the resources displayed as tiles
        And "Alice" logs out
