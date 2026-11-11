export type AppConfig = {
  formSubmissionApi: string;
  agentProxyUrl: string;
};

const normalizeApiUrl = (value: string | undefined): string => {
  const url = value?.trim() || "http://localhost:8080/";
  return url.endsWith("/") ? url : `${url}/`;
};

export const config: AppConfig = {
  formSubmissionApi: normalizeApiUrl(process.env.NEXT_PUBLIC_FORM_SUBMISSION_API),
  agentProxyUrl: normalizeApiUrl(process.env.NEXT_PUBLIC_AGENT_PROXY_URL),
};
