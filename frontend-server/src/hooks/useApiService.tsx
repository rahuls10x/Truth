    import { useNotification } from "@/contexts/NotificationContext";

    export interface APIResponse <T = unknown>{
        success: boolean, 
        error?:string, 
        message?:string,
        data?:T
    }

    export default function useApiService(link: string) {
        const {error} = useNotification();

        const makeRequest = async <T = unknown>(type: "GET" | 'POST' | "DELETE" | "PUT" | "PATCH" , path:string, body?:any): Promise<APIResponse<T> | undefined> =>{
            try {
                const response = await fetch(path, {
                    method: type,
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: body ? JSON.stringify(body) : null
                });
                const data = await response.json();
                return data as APIResponse<T>;
            } catch (err) {
                error("Unable to connect to server", "Try again later.");
                console.log(err);
            }
        } 

        const postRequest = async <T = unknown>(endpoint: string, body: any) : Promise<APIResponse< T >  | undefined> =>{
            const data = await makeRequest <T>("POST", `${link}${endpoint}`, body);
            return data;
        }

        const putRequest = async <T = unknown>(endpoint: string, body: any) : Promise<APIResponse <T> | undefined> =>{
            const data = await makeRequest<T>("PUT", `${link}${endpoint}`, body);
            return data;
        }

        const patchRequest = async <T = unknown>(endpoint: string, body: any) : Promise<APIResponse <T> | undefined> =>{
            const data = await makeRequest<T>("PATCH", `${link}${endpoint}`, body);
            return data;
        }
        
        const getRequest = async <T = unknown>(endpoint: string) : Promise<APIResponse <T> | undefined> =>{
            const data = await makeRequest<T>("GET", `${link}${endpoint}`);
            return data;
        }

        const deleteRequest = async <T = unknown>(endpoint: string, body: any) : Promise<APIResponse <T> | undefined> =>{
            const data = await makeRequest<T>("DELETE", `${link}${endpoint}`, body);
            return data;
        }

        return {postRequest, getRequest, putRequest, patchRequest, deleteRequest};
    }