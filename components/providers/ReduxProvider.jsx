"use client";

import { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import { store } from "@/store/store";
import { loginSuccess, logout, setLoading } from "@/store/slices/authSlice";
import api from "@/lib/api";

/**
 * SessionRehydrator: runs once after mount, restores Redux auth state
 * from the stored token by calling GET /users/profile.
 */
function SessionRehydrator({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem("shopease_token");
    if (!token) {
      dispatch(setLoading(false));
      return;
    }
    dispatch(setLoading(true));
    api
      .get("/users/profile")
      .then((res) => {
        const user = res.data?.data?.user;
        if (user) {
          dispatch(loginSuccess({ user, token, role: user.role }));
        } else {
          dispatch(logout());
          localStorage.removeItem("shopease_token");
        }
      })
      .catch(() => {
        dispatch(logout());
        localStorage.removeItem("shopease_token");
      })
      .finally(() => dispatch(setLoading(false)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}

export default function ReduxProvider({ children }) {
  return (
    <Provider store={store}>
      <SessionRehydrator>{children}</SessionRehydrator>
    </Provider>
  );
}
