# Example: Inbound Message Flow (SMS)

SMS/messaging flow with auto-reply and queue transfer.

```typescript
import type { ArchitectScripting } from "purecloud-flow-scripting-api-sdk-javascript";

export async function buildFlow(scripting: ArchitectScripting): Promise<void> {
    const { archFactoryFlows, archFactoryActions } = scripting.factories;

    const flow = await archFactoryFlows.createFlowInboundShortMessageAsync(
        "Example SMS Flow",
        "Simple SMS auto-reply and queue routing",
    );

    const initialState = flow.startUpObject;
    const sequence = initialState.outputSequence;

    // Send auto-reply message
    const reply = archFactoryActions.addActionSendResponse(sequence);
    reply.setResponseBodyByLiteralString(
        "Thank you for your message. An agent will respond to you shortly.",
    );

    // Transfer to messaging queue
    const transfer = archFactoryActions.addActionTransferToAcd(sequence);
    await transfer.setQueueByName("SMS Support Queue");

    await flow.checkInAsync();
}
```
