import type { InquiryFormData } from "@/components/inquiry-form";
import { config } from "@/lib/config";

interface FormSubmissionResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

/**
 * Submit an inquiry to the admissions API, which may optionally sync it to Salesforce.
 */
export async function submitFormLead(
  formData: InquiryFormData
): Promise<FormSubmissionResponse> {
  try {
    if (!config.formSubmissionApi) {
      throw new Error(
        "Form submission endpoint is not configured. Set NEXT_PUBLIC_FORM_SUBMISSION_API."
      );
    }

    // Prepare the payload to match the expected format from the backend
    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      cellPhone: formData.cellPhone,
      headquarters: formData.headquarters,
      programType: formData.programType,
      homePhone: formData.homePhone || "",
      dataAuthorization: formData.dataAuthorization,
    };

    const response = await fetch(`${config.formSubmissionApi}createFormLead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const message =
        errorBody && typeof errorBody.error === "string"
          ? errorBody.error
          : `HTTP error! status: ${response.status}`;
      console.error("[Form Submission] HTTP error:", response.status);
      throw new Error(message);
    }

    const responseData: { message?: string; data?: unknown } = await response.json();

    return {
      success: true,
      message: responseData.message || "Inquiry submitted.",
      data: responseData,
    };
  } catch (error) {
    console.error("[Form Submission] Error submitting form:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.",
    };
  }
}
