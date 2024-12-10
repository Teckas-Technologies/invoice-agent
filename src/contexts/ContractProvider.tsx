// ContractProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ethers, providers } from "ethers";
import { MYIDPresaleABI } from "@/config/ABI";
import { useAccount } from "wagmi";
import { constant } from "@/config/constants";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

declare global {
    interface Window {
        ethereum?:  Record<string, unknown> | undefined;
    }
}

const MYIDPresaleAddress = constant.presaleAddress;

// Create the context
const ContractContext = createContext<{
    provider: ethers.providers.Web3Provider | null;
    contract: ethers.Contract | null;
    myidBalance: string;
    refetchBalance: (account: string) => Promise<void>;
} | undefined>(undefined);


// ContractProvider component
export const ContractProvider = ({ children }: { children: ReactNode }) => {
    const [contract, setContract] = useState<ethers.Contract | null>(null);
    const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
    const [myidBalance, setMyidBalance] = useState("0");
    const { isConnected, address } = useAccount();

    // Function to fetch and set balances
    const getBalances = async (account: string) => {
        if (!contract) return;
        try {
            const [, , tokenBalance] = await contract.balancesOf(account);
            const balance = ethers.utils.formatUnits(tokenBalance, 18);
            setMyidBalance(Number(balance).toFixed(2));
        } catch (error) {
            console.error("Error fetching balances:", error);
        }
    };

    // Refetch balance function
    const refetchBalance = async (account: string) => {
        // if (account) {
        //     await   (account);
        // }
    };

    useEffect(() => {
        if (isConnected && address) {
            getBalances(address);
        }
    }, [isConnected, address, contract]);

    // useEffect(() => {
    //     if (isConnected && ethers && address && typeof window !== "undefined" && window.ethereum) {
    //         const provider = new ethers.providers.Web3Provider(window.ethereum);
    //         const signer = provider.getSigner();
    //         const contractInstance = new ethers.Contract(MYIDPresaleAddress, MYIDPresaleABI, signer);
    //         setProvider(provider);
    //         setContract(contractInstance);
    //     }
    // }, [isConnected, address]);

    useEffect(() => {
        const initializeContract = async () => {
            try {
                console.log("Step1", address);
                if (!isConnected || !address) return;
                console.log("Step2", isConnected);
                let detectedProvider = null;
                console.log("Step3", detectedProvider);
                if (window.ethereum) {
                    console.log("Step4", window.ethereum);
                    detectedProvider = new ethers.providers.Web3Provider(window.ethereum);
                    console.log("Step5", detectedProvider);
                    // const res = await detectedProvider.send("eth_requestAccounts", []);
                    // console.log("Step6", res);
                } else {
                    console.log("Step7");
                    const walletConnectProvider = await EthereumProvider.init({
                        projectId: constant.projectId,
                        chains: [constant.chainId as number],
                        showQrModal: true,
                    });
                    console.log("Step8", walletConnectProvider);
                    detectedProvider = new ethers.providers.Web3Provider(walletConnectProvider);
                    console.log("Step9", detectedProvider);
                }
                console.log("Step10");
                const accounts = await detectedProvider.listAccounts();
                console.log("Step11", accounts);
                if (!accounts.length) {
                    console.log("Step12");
                    alert("No accounts found. Please connect a wallet.");
                    return;
                }
                console.log("Step13");
                const network = await detectedProvider.getNetwork();
                console.log("Step14", network);
                if (network.chainId !== constant.chainId) {
                    console.log("Step15");
                    alert("Wrong network detected. Please switch to the correct network.");
                    return;
                }
                console.log("Step16");
                const signer = detectedProvider.getSigner();
                console.log("Step17", signer);
                const contractInstance = new ethers.Contract(MYIDPresaleAddress, MYIDPresaleABI, signer);
                console.log("Step18", contractInstance);
                setProvider(detectedProvider);
                console.log("Step19");
                setContract(contractInstance);
                console.log("Contract initialized:", contractInstance);
            } catch (error: any) {
                console.error("Error initializing contract:", error);
                alert(error.message || "Error initializing contract. Check the console for details.");
            }
        };

        initializeContract();
    }, [isConnected, address]);

    return (
        <ContractContext.Provider value={{ provider, contract, myidBalance, refetchBalance }}>
            {children}
        </ContractContext.Provider>
    );
};

// Custom hook to use the contract
export const useContract = () => {
    const context = useContext(ContractContext);
    if (context === undefined) {
        throw new Error("useContract must be used within a ContractProvider");
    }
    return context;
};