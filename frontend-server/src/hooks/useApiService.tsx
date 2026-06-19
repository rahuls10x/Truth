import { useNotification } from "@/contexts/NotificationContext";

export interface APIResponse{
    success: boolean, 
    error?:string, 
    message?:string,
    data?:any
}

export default function useApiService(link: string) {
    const {error} = useNotification();

    console.log(link);

    const makeRequest = async(type: "GET" | 'POST' | "DELETE" | "PUT" | "PATCH" , path:string, body?:any): Promise<APIResponse | undefined> =>{
        try {
            console.log(link + "/" + path);
            const response = await fetch(path, {
                method: type,
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: body ? JSON.stringify(body) : null
            });
            const data = await response.json();
            return data;
        } catch (err) {
            error("Unable to connect to server", "Try again later.");
            console.log(err);
        }
    } 

    const postRequest = async(endpoint: string, body: any) : Promise<APIResponse | undefined> =>{
        const data = await makeRequest("POST", `${link}${endpoint}`, body);
        return data;
    }

    const putRequest = async(endpoint: string, body: any) : Promise<APIResponse | undefined> =>{
        const data = await makeRequest("PUT", `${link}${endpoint}`, body);
        return data;
    }
    
    const getRequest = async(endpoint: string) : Promise<APIResponse | undefined> =>{
        const data = await makeRequest("GET", `${link}${endpoint}`);
        return data;
    }

    return {postRequest, getRequest, putRequest};
}