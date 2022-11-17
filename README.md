## <h2><a href="" target="_blank" rel="noopener noreferrer"><img width="48" src="icons/group_tab_icon.png" alt="FirefoxGT"></a> FirefoxGT</h2>

Have Chrome-like group tabs in firefox

# Description

FirefoxGT allows group up tabs in the user's windows in a chrome like fashion. The extension allows users to create group tabs which will hold and hide the user's tab to not have to many tabs displayed at once.

The extension also supports "Close Group Mode" which hides all inner tabs of a group unless the user is activity using them.

Pinned Group Tabs also have a unique form as they allow the inner tabs to be located in any location the user wants (note that you can't have pinned inner tabs)

## Usage

```bash
$ yarn install
$ yarn start
```

### `yarn start`

Build the extension into `dist/webext-dev` folder for **development**.

### `yarn build`

Build the extension into `dist/webext-prod` folder for **production**.

### `yarn build-zip`

Build a zip file following this format `<name>-<version>.zip` file.
Zip file is located in `dist/webext-zip` folder.

## Known Issues:

- This extension may conflict with other programs similar in functionality.
  Conflicted addons:

  - Simple Tab Group
  - Tab Open/Close Control
  - OneTab
  - Tiled Tab Groups
  - Totally not Panorama (Tab Groups with tab hiding)
  - Panorama Tab Groups
  - Panorama View (etc.)

- Dragging group tabs (that aren't in Closed Group Mode) can be somewhat difficult as it conflicts with the close/open nature of clicking the tab so it's recommended to use the "Enter group tab" command before moving it.

- Some websites extensions can't display dialogs in as firefox blocks them from doing so, a notification is displayed instead and the action is canceled

## Permissions used:

- **tabs**: for handling tab actions (create, move, update...)
- **tabHide**: for hiding tabs
- **activeTab**: for specific tab actions that require the current screen
- **contextMenus**: for multiple actions done via the menus
- **storage**: for saving group tab and settings data locally
- **<all_urls>(Access your data for almost all websites)**: for tab thumbnails, dialogs and tab actions
- **notifications**: for notification on move tab to group error, etc.
- **bookmarks**: Used for certain context menu actions
- **history**: for deleting group tabs from history if setting is marked
- **sessions**: for saving groups between browser closing

# License

This project is licensed under the terms of the [MIT License](LICENSE).
