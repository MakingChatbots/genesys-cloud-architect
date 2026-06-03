# Example: Inbound Email Flow

Email flow with auto-reply and queue transfer.

```typescript
import type { ArchitectScripting } from "purecloud-flow-scripting-api-sdk-javascript";

export async function buildFlow(scripting: ArchitectScripting) {
    const { archFactoryFlows, archFactoryActions } = scripting.factories;

    const flow = await archFactoryFlows.createFlowInboundEmailAsync(
        "Example Email Flow",
        "Simple email handling flow",
    );

    const initialState = flow.startUpObject;
    const sequence = initialState.outputSequence;

    // Send auto-reply
    const autoReply = archFactoryActions.addActionSendAutoReply(sequence);
    autoReply.setFromAddressByLiteralString("noreply@example.com");
    autoReply.setSubjectByLiteralString("We received your email");
    autoReply.setBodyByLiteralString(
        "Thank you for your email. We have received it and will respond shortly.",
    );

    // Transfer to email queue
    const transfer = archFactoryActions.addActionTransferToAcd(sequence);
    await transfer.setQueueByName("Email Support Queue");

    return await flow.checkInAsync();
}
```
