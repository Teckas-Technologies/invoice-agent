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
    setContractAddress(params.get("contractAddress") || "default-address");
    setAbi(params.get("abi") || "default-abi");
    setAgentId(params.get("agentId") || "default-agentId");
  }, []);

  return (
    <ContractProvider
    //   contractAddress={contractAddress}
    //   abi={abi}
    //   agentId={agentId}
    >
      {children}
    </ContractProvider>
  );
}
