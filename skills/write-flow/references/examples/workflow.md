# Example: Workflow (Callback)

Automated workflow that creates a callback request.

```typescript
import type { ArchitectScripting } from "purecloud-flow-scripting-api-sdk-javascript";

export async function buildFlow(scripting: ArchitectScripting) {
    const { archFactoryFlows, archFactoryActions } = scripting.factories;

    const flow = await archFactoryFlows.createFlowWorkflowAsync(
        "Example Workflow",
        "Simple callback acknowledgment workflow",
    );

    const initialState = flow.startUpObject;
    const sequence = initialState.outputSequence;

    // Create callback number variable
    const callbackVar = flow.addVariableString("callbackNumber");
    callbackVar.setDefaultValueAsString("Not provided");

    // Set callback number from caller ANI
    const setVar = archFactoryActions.addActionSetVariable(sequence);
    setVar.variableName = "Flow.callbackNumber";
    setVar.variableValue = "Call.Ani";

    // Create callback request
    const callback = archFactoryActions.addActionCreateCallback(sequence);
    await callback.setQueueByName("Callback Queue");
    callback.callbackNumberExpression = "Flow.callbackNumber";

    // End workflow
    archFactoryActions.addActionEndWorkflow(sequence);

    return await flow.checkInAsync();
}
```
