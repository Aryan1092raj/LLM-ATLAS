import { createContext, useContext } from "react";

export const DataContext = createContext({
  data: null,
  companies: [],
  allModels: [],
  findModel: () => null
});

export const useData = () => useContext(DataContext);