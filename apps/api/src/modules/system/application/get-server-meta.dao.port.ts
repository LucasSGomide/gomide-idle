// naming.md rules 2, 7: a DAO port lives in application/, is suffixed Port and
// sits in a .port.ts file. A DAO (architecture-api.md rule 30), not a
// repository: this is a read with no aggregate behind it.

// naming.md rule 8: a data shape is `type FooType`, never a bare interface.
export type ServerMetaRowType = {
  socketProtocolVersion: number;
  contentPackVersion: string;
  buildId: string;
};

export interface GetServerMetaDaoPort {
  getServerMeta(): Promise<ServerMetaRowType>;
}
