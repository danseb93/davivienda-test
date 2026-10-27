export interface SecurityRequirement {
  Public?: string[];
  bearer?: string[];
}

interface PathMethod {
  security?: SecurityRequirement[];
  [key: string]: unknown;
}

interface PathItem {
  get?: PathMethod;
  post?: PathMethod;
  put?: PathMethod;
  delete?: PathMethod;
  patch?: PathMethod;
  [key: string]: PathMethod | undefined;
}

export interface Paths {
  [path: string]: PathItem;
}
