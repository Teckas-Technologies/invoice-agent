"use client";

import { useState, useEffect } from "react";
import { ContractProvider } from "@/contexts/ContractProvider";

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [contractAddress, setContractAddress] = useState<string>("");
  const [abi, setAbi] = useState<string>("");
  const [agentId, setAgentId] = useState<string>("");

  useEffect(() => {
    // Extract query parameters from URL
    const params = new URLSearchParams(window.location.search);
    const contractAddress = params.get("contractAddress");
    const abi = params.get("abi");
    const agentId = params.get("agentId");
    // alert(contractAddress)
    // alert(abi)
    // alert(agentId)
  }, []);

  return (
    <ContractProvider
      contractAddress={contractAddress}
      abi={abi}
    >
      {children}
    </ContractProvider>
  );
}
