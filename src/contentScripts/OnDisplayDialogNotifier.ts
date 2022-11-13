import { ContentMessageType } from "../utils/messages/ContentMessageType";
import { BaseEventNotifier } from "../utils/BaseEventNotifier";

/**
 * Notifies when group tab was changed in some way (not including removing a inner tab)
 *
 * Uses Listeners of type (groupTab : GroupTab)=>void where groupTab is the group tab that was edited
 */
export class OnDisplayDialogNotifier extends BaseEventNotifier<
  (type?: ContentMessageType, data?: any) => void
> {
  constructor() {
    super();
  }

  /**
   * Notifies the listeners about a new dialog request
   * @param type The type od the dialog
   * @param data The data to be displayed in the dialog
   */
  requestDialog(type?: ContentMessageType, data?: any) {
    this.listeners.forEach((listener) => {
      listener(type, data);
    });
  }
}
