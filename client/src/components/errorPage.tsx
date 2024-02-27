import React, { useEffect } from "react";
import { setPageTitle } from "../utils/util.ts";

interface ErrorPageProps {
  message: string;
}
const ErrorPage: React.FC<ErrorPageProps> = ({ message }) => {
  useEffect(() => {
    setPageTitle("Natours | Error Page");
  }, []);

  return (
    <main className="main">
      <div className="error">
        <div className="error__title">
          <h2 className="heading-secondary heading-secondary--error">
            Something went wrong! Contact the administrator.
          </h2>
          <h2 className="error__emoji">💥</h2>
        </div>
        <div className="error__msg">{message}</div>
      </div>
    </main>
  );
};

export default ErrorPage;
