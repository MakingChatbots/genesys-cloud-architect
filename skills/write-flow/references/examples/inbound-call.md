# Example: Inbound Call Flow (IVR)

Simple IVR with a welcome message, main menu with 3 choices, and queue transfers.

```typescript
import type { ArchitectScripting } from "purecloud-flow-scripting-api-sdk-javascript";

export async function buildFlow(scripting: ArchitectScripting) {
    const { archFactoryFlows, archFactoryActions, archFactoryMenus } = scripting.factories;

    const flow = await archFactoryFlows.createFlowInboundCallAsync(
        "Example IVR Menu",
        "Simple IVR with Sales/Support/Billing options",
    );

    const initialState = flow.startUpObject;

    // Play welcome message
    const welcome = archFactoryActions.addActionPlayAudio(initialState.outputSequence);
    welcome.setTextToSpeak("Thank you for calling. Please listen to the following options.");

    // Create main menu
    const mainMenu = archFactoryMenus.addMenu(flow, "Main Menu");
    mainMenu.setMenuPromptByText("Press 1 for Sales, 2 for Support, or 3 for Billing");

    // Add menu choices with queue transfers
    const salesChoice = mainMenu.addMenuChoice("1", "Sales");
    const salesTransfer = archFactoryActions.addActionTransferToAcd(salesChoice.outputSequence);
    await salesTransfer.setQueueByName("Sales Queue");

    const supportChoice = mainMenu.addMenuChoice("2", "Support");
    const supportTransfer = archFactoryActions.addActionTransferToAcd(supportChoice.outputSequence);
    await supportTransfer.setQueueByName("Support Queue");

    const billingChoice = mainMenu.addMenuChoice("3", "Billing");
    const billingTransfer = archFactoryActions.addActionTransferToAcd(billingChoice.outputSequence);
    await billingTransfer.setQueueByName("Billing Queue");

    // Jump to menu from initial state
    const jumpToMenu = archFactoryActions.addActionJumpToMenu(initialState.outputSequence);
    jumpToMenu.targetMenu = mainMenu;

    return await flow.checkInAsync();
}
```
