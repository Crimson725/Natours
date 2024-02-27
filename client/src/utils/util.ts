interface AxiosError {
  response?: {
    data?: {
      message: string;
    };
    status?: number;
    statusText?: string;
  };
  message: string;
}
type AppError = AxiosError | Error;
const setPageTitle = (newPageTitle: string) => {
  document.title = newPageTitle;
};
const getQueryParams = (queryString: string, key: string) => {
  const queryParams = new URLSearchParams(queryString);
  return queryParams.get(key);
};
const hideAlert = () => {
  const el = document.querySelector(".alert");
  if (el) el.parentElement?.removeChild(el);
};

const showAlert = (type: string, message: string, time: number = 5) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${message}</div>`;
  document.querySelector("body")?.insertAdjacentHTML("afterbegin", markup);
  window.setTimeout(hideAlert, time * 1000);
};
const handleAlert = (error: AppError) => {
  let errorMessage = "";
  if ("response" in error && import.meta.env.MODE === "development") {
    errorMessage = error.response?.data?.message || error.message;
  } else if (import.meta.env.MODE === "production") {
    errorMessage = "Something went wrong! Contact the administrator.";
  } else {
    errorMessage = error.message;
  }
  showAlert("error", errorMessage);
};

export { setPageTitle, getQueryParams, handleAlert };
