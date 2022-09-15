// Put all the javascript code here, that you want to execute in background.


function onCreated(tab) {
    console.log({tab})
}

function onError(error) {
    console.log(`Error: ${error}`);
}

browser.contextMenus.create({
    id: "add-group-tab",
    title: "Put this tab in new group tab",
    contexts: ["tab"],
});

browser.contextMenus.onClicked.addListener((info, tab) => {

    if (info.menuItemId === "add-group-tab") {

        let creating = browser.tabs.create({
            // TODO Change url to local html file that show a list of the tabs
            url: "https://developer.mozilla.org/en-US/Add-ons/WebExtensions",
            index: tab.index,
            discarded: true,
            title: "test",

        });

        creating.then(onCreated, onError);

    }


})