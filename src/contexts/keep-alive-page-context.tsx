
import { createContext, useContext } from "react";

const KeepAlivePageContext = createContext<boolean>(true);

export const KeepAlivePageProvider = KeepAlivePageContext.Provider;

export function useKeepAlivePageActive() {
  return useContext(KeepAlivePageContext);
}
