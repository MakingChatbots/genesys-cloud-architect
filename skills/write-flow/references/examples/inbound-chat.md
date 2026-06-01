# Example: Inbound Chat Flow

Chat flow with a greeting message and queue transfer.

```typescript
import type { ArchitectScripting } from "purecloud-flow-scripting-api-sdk-javascript";

export async function buildFlow(scripting: ArchitectScripting): Promise<void> {
    const { archFactoryFlows, archFactoryActions } = scripting.factories;

    const flow = await archFactoryFlows.createFlowInboundChatAsync(
        "Example Chat Flow",
        "Simple chat flow with greeting and queue transfer",
    );

    const initialState = flow.startUpObject;

    // Send initial greeting message
    const greeting = archFactoryActions.addActionSendResponse(initialState);
    greeting.messageBody.setExpression(
        '"Hello! Thank you for contacting us. Please wait while we connect you to an agent."',
    );

    // Transfer to chat queue
    const transfer = archFactoryActions.addActionTransferToAcd(initialState);
    await transfer.setQueueByName("Chat Support Queue");

    await flow.checkInAsync();
}
```
