export interface ExampleType {
  id: number;
  name: string;
  isActive: boolean;
}

export type ExampleProps = {
  title: string;
  onClick: () => void;
};