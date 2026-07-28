import { createContext } from "react";

export const DataContext = createContext({
  data: null,
  companies: [],
  allModels: [],
  findModel: () => null
});