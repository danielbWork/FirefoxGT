import { ContentDialogHandler } from "../../contentScripts/ContentDialogHandler";
import { ContentMessageHandler } from "../../contentScripts/ContentMessageHandler";

ContentDialogHandler.instance.setupDialogHandler();
ContentMessageHandler.instance.setup();
