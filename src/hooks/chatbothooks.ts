import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useFetchRequests } from "./useFetchrequest";
import { parseUnits, zeroAddress } from "viem";
import { useWalletClient } from "wagmi";
import { currencies } from "@/config/currencies";
import { storageChains } from "@/config/storage-chain";
import {
  RequestNetwork,
  Types,
  Utils,
} from "@requestnetwork/request-client.js";
import { Web3SignatureProvider } from "@requestnetwork/web3-signature";
import { useProvider } from "@/contexts/ContractProvider";
import { ethers } from "ethers";

interface Data {
  recipientAddress: string;
  currency: string;
  payerAddress: string;
  amount: string;
  storageChain: string;
  dueDate: string;
  reason: string;
}
declare global {
  interface Window {
      walletClient?: any; // ethers.providers.ExternalProvider
  }
} 
export enum APP_STATUS {
  AWAITING_INPUT = "awaiting input",
  SUBMITTING = "submitting",
  PERSISTING_TO_IPFS = "persisting to ipfs",
  PERSISTING_ON_CHAIN = "persisting on-chain",
  REQUEST_CONFIRMED = "request confirmed", //=
  APPROVING = "approving",
  APPROVED = "approved",
  PAYING = "paying",
  REQUEST_PAID = "request paid",
  ERROR_OCCURRED = "error occurred",//=
}


const useVoiceBackend = () => {
  // State to hold the session ID, messages, and API response
  const [isPaymentRequired, setIsPaymentRequired] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]); // Store messages
  const [isloading, setIsLoading] = useState<boolean>(false);
  const { fetchRequests } = useFetchRequests();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [status, setStatus] = useState(APP_STATUS.AWAITING_INPUT);
  const [requestData, setRequestData] = useState<Types.IRequestDataWithEvents>();
  const { provider } = useProvider();
  const {address} = useAccount();
  const {data:walletClient} = useWalletClient();
  const [dummyClient, setDummyClient] = useState();
  // Function to generate a unique session ID
  const generateSessionId = () => {
    return `session-${Math.random().toString(36).substring(2, 15)}`;
  };

  // Hook to initialize session ID when the chat is opened
  useEffect(() => {
    const session = generateSessionId(); // Generate a new session ID
    setSessionId(session);
  }, []);
  const convertToWholeNumber = (amount: string, decimals: number): number => {
    // Convert the string to a number and divide by 10^decimals to shift decimal points
    return parseInt(amount) / Math.pow(10, decimals);
};

const setMessage = (sender: string, text: string) => {
  setMessages((prevMessages) => [
    ...prevMessages,
    { sender, text },
  ]);
};


  // Function to make the API call
  const sendRequest = async (query: string, isWalletConnected: string, agentId: string) => {
    if (!sessionId) return;
    setIsLoading(true);

    const payload = {
      id: sessionId, // Using the session ID here
      prompt: JSON.stringify({ query, isWalletConnected }),
      agentId: agentId,
    };
    console.log(payload)

    // Add the user's message to the state before sending the request
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: "user", text: query },
    ]);

    try {
      const response = await fetch(
        "https://rnp-master-agent-d2b5etd8cwgzcaer.canadacentral-01.azurewebsites.net/voice-backend",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      console.log(response);
      const res = await response.json();
      console.log(res)
      console.log(res);
      const data = res.data;
      console.log(data);
      // console.log(data.meta_data.isFetchPaymentRequest);

      if (data.meta_data.isFetchPaymentRequest || data.intent==="fetchPaymentRequests"  ) {
        if (address) {
          const res = await fetchRequests(address);
          console.log("RES:", res);
          if (res) {
            if (Array.isArray(res)) {
              setIsPaymentRequired(true);
              const formattedResponses = res.map((item: any, index: number) => {
                const reason = item.contentData?.reason || "N/A";
                const dueDate = item.contentData?.dueDate || "N/A";
                const builderId = item.contentData?.builderId || "N/A";
                const state = item.state || "N/A";
                const currency = item.currency || "N/A";
                const status = item.balance?.balance === item.expectedAmount ? "Paid" : "Unpaid";
                const requestId = item.requestId || "N/A";
                const payer = item.payer?.value || "N/A";
                const amount = convertToWholeNumber(item.expectedAmount,6) || "N/A";
                const payee = item.payee?.value || "N/A";

                return `
                Request ${index + 1}\n
                <br/> Currency: $${amount}\n
                 <br/> Payer: ${payer}\n
                  <br/> Payee: ${payee}\n
               <br/> Status: ${status}\n
               <br/> <span hidden> RequestId: ${requestId}\n</span>
              `;
              });
              if (!data.text) {
                if (data.intent === "getCurrency") {
                  setMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: "bot", text: "Great! Now, please specify the currency you want to use for the payment request." },
                  ]);
                } else if (data.intent === "getAmount") {
                  setMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: "bot", text: "Perfect! Next, please enter the amount for the payment request" },
                  ]);
                } else if (data.intent === "getReason") {
                  setMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: "bot", text: "Got it! Now, please provide the reason for this payment request." },
                  ]);
                } else if (data.intent === "getExtradetails" || data.intent === "getExtraDetailName1" || data.intent === "getExtraDetailName2") {
                  setMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: "bot", text: "Do you have any additional details for this payment request?" },
                  ]);
                }else if(data.intent==="fetchPaymentRequests"){
                  setMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: "bot", text: "Fetching.." },
                  ]);
                }
                else {
                  setMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: "bot", text: data.text },
                  ]);
                }
              } else {
                setMessages((prevMessages) => [
                  ...prevMessages,
                  { sender: "bot", text: data.text },
                ]);
              }

              // Add each formatted response to the chatbot messages
              formattedResponses.forEach((responseText: any) => {
                setMessages((prevMessages) => [
                  ...prevMessages,
                  { sender: "bot", text: responseText },
                ]);
              });
            } else {
              setMessages((prevMessages) => [
                ...prevMessages,
                { sender: "bot", text: "Unable to fetch your invoice" },
              ]);
            }
          }
        }

      }
      else if (data.intent === "finalJson") {
        if (!walletClient) {
          setError("No wallet client available.");
          setLoading(false);
          return;
      }
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const extraData = data.meta_data?.extra || {};
          const signatureProvider = new Web3SignatureProvider(walletClient);
          const requestClient = new RequestNetwork({
              nodeConnectionConfig: {
                  baseURL: "https://sepolia.gateway.request.network/",
              },
              signatureProvider,
          });

          const requestCreateParameters: Types.ICreateRequestParameters = {
            requestInfo: {
                currency: {
                    type: Types.RequestLogic.CURRENCY.ERC20,
                    value: "0x0EC435037161ACd3bB94eb8DF5BC269f17A4E1b9",
                    network: "sepolia",
                },
                expectedAmount: parseUnits(
                    data.meta_data.amount                          ,
                    6,
                ).toString(),
                payee: {
                    type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
                    value: address as string,
                },
                timestamp: Utils.getCurrentTimestampInSecond(),
            },
            paymentNetwork: {
                id: Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
                parameters: {
                    paymentNetworkName: "sepolia",
                    paymentAddress: data.recipientAddress || address,
                    feeAddress: zeroAddress,
                    feeAmount: "0",
                },
            },
            contentData: {
                reason: data.reason,
                ...extraData
            },
            signer: {
                type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
                value: address as string,
            },
        };

          if (data.payerAddress) {
              requestCreateParameters.requestInfo.payer = {
                  type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
                  value: data.payerAddress,
              };
          }

          setStatus(APP_STATUS.PERSISTING_TO_IPFS);
          const request = await requestClient.createRequest(requestCreateParameters);
          setStatus(APP_STATUS.PERSISTING_ON_CHAIN);
          setRequestData(request.getData());
          const confirmedRequestData = await request.waitForConfirmation();

          setStatus(APP_STATUS.REQUEST_CONFIRMED);
          setRequestData(confirmedRequestData);
          setSuccess(true);
          console.log("confirmedRequestData", confirmedRequestData)
          setSuccess(true)
          setMessages((prevMessages) => [
            ...prevMessages,
            { sender: "bot", text: data.text },
          ]);
             setMessages((prevMessages) => [
            ...prevMessages,
            { sender: "bot", text: `<a href="https://scan.request.network/request/${confirmedRequestData.requestId}" target="_blank" 
> view </a>` },
          ]); 
          return { success: true }
      } catch (error) {
          console.error('Error creating request:', error);
          setError('Failed to create request');
          setStatus(APP_STATUS.ERROR_OCCURRED);
          setMessages((prevMessages) => [   
            ...prevMessages,
            { sender: "bot", text: "Your invoice created has failed" },
          ]);
          console.log("Error:", error)
          return { success: false }
      } finally {
          setLoading(false);
      }
  }               
       else {
        // Extract the text from the response and store it in the messages state
        const botMessage = data.text || "No response from bot";

        // Add the bot's response to the state
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "bot", text: botMessage },
        ]);
      }
    } catch (error: any) {
      console.error("Error during request:", error.message);
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "bot", text: "Something went wrong!" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sessionId,
    messages,
    isloading,
    isPaymentRequired,
    sendRequest,
    setMessage
  };
};

export default useVoiceBackend;
