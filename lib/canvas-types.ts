export type CanvasSide = 'top' | 'right' | 'bottom' | 'left';
export type CanvasEnd = 'none' | 'arrow';
export type CanvasColor = string;

export type CanvasNodeBase = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: CanvasColor;
};

export type CanvasTextNode = CanvasNodeBase & {
  type: 'text';
  text: string;
};

export type CanvasFileNode = CanvasNodeBase & {
  type: 'file';
  file: string;
  subpath?: string;
};

export type CanvasLinkNode = CanvasNodeBase & {
  type: 'link';
  url: string;
};

export type CanvasGroupNode = CanvasNodeBase & {
  type: 'group';
  label?: string;
  background?: string;
  backgroundStyle?: 'cover' | 'ratio' | 'repeat';
};

export type CanvasNode =
  | CanvasTextNode
  | CanvasFileNode
  | CanvasLinkNode
  | CanvasGroupNode;

export type CanvasEdge = {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide?: CanvasSide;
  toSide?: CanvasSide;
  fromEnd?: CanvasEnd;
  toEnd?: CanvasEnd;
  color?: CanvasColor;
  label?: string;
};

export type CanvasData = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};
