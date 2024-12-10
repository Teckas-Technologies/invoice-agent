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
import { ethers } from "ethers";
import { useGeneric } from "./useGeneric";

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
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [dummyClient, setDummyClient] = useState();
  const { funcCall, getfuncTokenValue } = useGeneric();
  const [funcCalling, setFuncCalling] = useState(false);
  const [approving, setApproving] = useState(false);
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
        "https://abi-master-agent-dgcmghddard0h8d2.canadacentral-01.azurewebsites.net/voice-backend",
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


      if (data.intent === "final_json") {
        if (!address) {
          setMessages((prevMessages) => [
            ...prevMessages,
            { sender: "bot", text: "Please connect your wallet!" },
          ]);
          return;
        }
        const contractAddress = data.meta_data.contract;
        const functionName = data.meta_data.functionName;
        const gasLimit = data.meta_data.gasLimit;
        const parameters = data.meta_data.parameters;

        if (!address || (address.trim().startsWith("0x") && address.trim().length !== 42)) {
          setMessages((prevMessages) => [
            ...prevMessages,
            { sender: "bot", text: "Not a valid connected address!" },
          ]);
          return;
        }

        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "bot", text: `Function Name: ${functionName}!` },
        ]);
        setFuncCalling(true);

        const res = await getfuncTokenValue(functionName, parameters, gasLimit);

        console.log("RES:", res);

        if (res?.isGas) {
          console.log("RES1:", res.data)
          setFuncCalling(false);
        }

        if (!res?.isGas && res) {
          console.log("RES2:", res.data)
          setFuncCalling(false);
        }

      } else if (data.intent === "get_approve") {
        if (!address) {
          setMessages((prevMessages) => [
            ...prevMessages,
            { sender: "bot", text: "Please connect your wallet!" },
          ]);
          return;
        }

        setApproving(true);

        try {
          const res = await funcCall("100");
          console.log("RES:", res);

          setMessages((prevMessages) => [
            ...prevMessages,
            { sender: "bot", text: "Approve executed successfully!" },
          ]);
        } catch (error) {
          console.error("Error during approval:", error);

          setMessages((prevMessages) => [
            ...prevMessages,
            { sender: "bot", text: "Approval execution failed." },
          ]);
        } finally {
          setApproving(false);
        }
      } else {
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
    approving,
    funcCalling,
    sendRequest,
    setMessage
  };
};

export default useVoiceBackend;
