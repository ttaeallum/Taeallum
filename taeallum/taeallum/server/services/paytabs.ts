import { getConfig } from "../config";

interface PayTabsConfig {
    profileId: string;
    serverKey: string;
    region: string;
}

interface InitiatePaymentRequest {
    cartId: string;
    cartDescription: string;
    cartCurrency: string;
    cartAmount: number;
    callback: string;
    return: string;
    customerDetails: {
        name: string;
        email: string;
        phone?: string;
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        zip?: string;
        ip?: string;
    };
    userDefined?: any;
}

export class PayTabsService {
    private config: PayTabsConfig;
    private baseUrl: string;

    constructor() {
        // We use getConfig for safe fallback or env vars
        // Default to Jordan (JO) endpoint if not specified
        const region = getConfig("PAYTABS_REGION") || "JO";

        this.config = {
            profileId: getConfig("PAYTABS_PROFILE_ID") || "109866", // Placeholder from docs or draft
            serverKey: getConfig("PAYTABS_SERVER_KEY") || "SKJ96G99G9-HDBKJ96G99-HDBKJ96G99", // Placeholder
            region: region
        };

        // Determine Base URL based on region
        // Jordan: https://secure-jordan.paytabs.com/
        // KSA: https://secure.paytabs.sa/
        // Global: https://secure-global.paytabs.com/
        if (region === "SA") {
            this.baseUrl = "https://secure.paytabs.sa/";
        } else if (region === "JO") {
            this.baseUrl = "https://secure-jordan.paytabs.com/";
        } else {
            this.baseUrl = "https://secure-global.paytabs.com/";
        }
    }

    /**
     * Create a payment page (Hosted Payment Page)
     */
    async createPaymentPage(request: InitiatePaymentRequest) {
        const url = `${this.baseUrl}payment/request`;

        const payload = {
            profile_id: this.config.profileId,
            tran_type: "sale",
            tran_class: "ecom",
            cart_id: request.cartId,
            cart_description: request.cartDescription,
            cart_currency: request.cartCurrency,
            cart_amount: request.cartAmount,
            callback: request.callback,
            return: request.return,
            "customer_details": request.customerDetails,
            "hide_shipping": true,
        };

        console.log("[PayTabs] Initiating Payment:", { url, payload });

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "authorization": this.config.serverKey,
                    "content-type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("[PayTabs] Error Response:", data);
                throw new Error(data.message || "Failed to initiate payment");
            }

            console.log("[PayTabs] Success Response:", data);
            return data; // Contains redirect_url and tran_ref
        } catch (error) {
            console.error("[PayTabs] Request Failed:", error);
            throw error;
        }
    }

    /**
     * Verify payment status using transaction reference
     */
    async verifyPayment(tranRef: string) {
        const url = `${this.baseUrl}payment/query`;

        const payload = {
            profile_id: this.config.profileId,
            tran_ref: tranRef
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "authorization": this.config.serverKey,
                    "content-type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("[PayTabs] Verification Failed:", error);
            throw error;
        }
    }
}

export const payTabsService = new PayTabsService();
