// naming.md rule 9: a use case's input is <Verb><Resource>InputType. This read
// takes no parameters, but the type exists so an HTTP controller and a socket
// handler pass the same shape into the same use case (architecture-api.md
// rule 25).
export type GetServerMetaInputType = Record<string, never>;
