export type Lip = {
  "version": "0.1.0",
  "name": "liquidity_incentive_program",
  "constants": [
    {
      "name": "CAMPAIGN_SEED",
      "type": "string",
      "value": "\"campaign\""
    },
    {
      "name": "CAMPAIGN_AUTH_SEED",
      "type": "string",
      "value": "\"campaign_auth\""
    },
    {
      "name": "DEPOSIT_MFI_AUTH_SIGNER_SEED",
      "type": "string",
      "value": "\"deposit_mfi_auth\""
    },
    {
      "name": "TEMP_TOKEN_ACCOUNT_AUTH_SEED",
      "type": "string",
      "value": "\"ephemeral_token_account_auth\""
    },
    {
      "name": "MARGINFI_ACCOUNT_SEED",
      "type": "string",
      "value": "\"marginfi_account\""
    }
  ],
  "instructions": [
    {
      "name": "createCampaing",
      "accounts": [
        {
          "name": "campaign",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "campaignRewardVault",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "campaign"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Campaign",
                "path": "campaign"
              }
            ]
          }
        },
        {
          "name": "campaignRewardVaultAuthority",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "campaign_auth"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Campaign",
                "path": "campaign"
              }
            ]
          }
        },
        {
          "name": "assetMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginfiBank",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "fundingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "lockupPeriod",
          "type": "u64"
        },
        {
          "name": "maxDeposits",
          "type": "u64"
        },
        {
          "name": "maxRewards",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createDeposit",
      "accounts": [
        {
          "name": "campaign",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "deposit",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mfiPdaSigner",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "deposit_mfi_auth"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Deposit",
                "path": "deposit"
              }
            ]
          }
        },
        {
          "name": "fundingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tempTokenAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "assetMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginfiGroup",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginfiBank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "marginfi_account"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Deposit",
                "path": "deposit"
              }
            ]
          }
        },
        {
          "name": "marginfiBankVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginfiProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "endDeposit",
      "accounts": [
        {
          "name": "campaign",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "campaignRewardVault",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "campaign"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Campaign",
                "path": "campaign"
              }
            ]
          }
        },
        {
          "name": "campaignRewardVaultAuthority",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "campaign_auth"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Campaign",
                "path": "campaign"
              }
            ]
          }
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "deposit",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mfiPdaSigner",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "deposit_mfi_auth"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Deposit",
                "path": "deposit"
              }
            ]
          }
        },
        {
          "name": "tempTokenAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tempTokenAccountAuthority",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "ephemeral_token_account_auth"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Deposit",
                "path": "deposit"
              }
            ]
          }
        },
        {
          "name": "destinationAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "assetMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "marginfi_account"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Deposit",
                "path": "deposit"
              }
            ]
          }
        },
        {
          "name": "marginfiGroup",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginfiBank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginfiBankVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginfiBankVaultAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginfiProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "Campaign",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "lockupPeriod",
            "type": "u64"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "maxDeposits",
            "type": "u64"
          },
          {
            "name": "remainingCapacity",
            "type": "u64"
          },
          {
            "name": "maxRewards",
            "type": "u64"
          },
          {
            "name": "marginfiBankPk",
            "type": "publicKey"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u64",
                16
              ]
            }
          }
        ]
      }
    },
    {
      "name": "Deposit",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "campaign",
            "type": "publicKey"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u64",
                16
              ]
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "CampaignNotActive",
      "msg": "Campaign is not active"
    },
    {
      "code": 6001,
      "name": "DepositAmountTooLarge",
      "msg": "Deposit amount is to large"
    },
    {
      "code": 6002,
      "name": "DepositNotMature",
      "msg": "Deposit hasn't matured yet"
    }
  ]
}

export const IDL: Lip = {
  "version": "0.1.0",
  "name": "liquidity_incentive_program",
  "constants": [
    {
      "name": "CAMPAIGN_SEED",
      "type": "string",
      "value": "\"campaign\""
    },
    {
      "name": "CAMPAIGN_AUTH_SEED",
      "type": "string",
      "value": "\"campaign_auth\""
    },
    {
      "name": "DEPOSIT_MFI_AUTH_SIGNER_SEED",
      "type": "string",
      "value": "\"deposit_mfi_auth\""
    },
    {
      "name": "TEMP_TOKEN_ACCOUNT_AUTH_SEED",
      "type": "string",
      "value": "\"ephemeral_token_account_auth\""
    },
    {
      "name": "MARGINFI_ACCOUNT_SEED",
      "type": "string",
      "value": "\"marginfi_account\""
    }
  ],
  "instructions": [
    {
      "name": "createCampaing",
      "accounts": [
        {
          "name": "campaign",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "campaignRewardVault",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "campaign"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Campaign",
                "path": "campaign"
              }
            ]
          }
        },
        {
          "name": "campaignRewardVaultAuthority",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "campaign_auth"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Campaign",
                "path": "campaign"
              }
            ]
          }
        },
        {
          "name": "assetMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginfiBank",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "fundingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "lockupPeriod",
          "type": "u64"
        },
        {
          "name": "maxDeposits",
          "type": "u64"
        },
        {
          "name": "maxRewards",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createDeposit",
      "accounts": [
        {
          "name": "campaign",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "deposit",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mfiPdaSigner",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "deposit_mfi_auth"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Deposit",
                "path": "deposit"
              }
            ]
          }
        },
        {
          "name": "fundingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tempTokenAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "assetMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginfiGroup",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginfiBank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "marginfi_account"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Deposit",
                "path": "deposit"
              }
            ]
          }
        },
        {
          "name": "marginfiBankVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginfiProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "endDeposit",
      "accounts": [
        {
          "name": "campaign",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "campaignRewardVault",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "campaign"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Campaign",
                "path": "campaign"
              }
            ]
          }
        },
        {
          "name": "campaignRewardVaultAuthority",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "campaign_auth"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Campaign",
                "path": "campaign"
              }
            ]
          }
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "deposit",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mfiPdaSigner",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "deposit_mfi_auth"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Deposit",
                "path": "deposit"
              }
            ]
          }
        },
        {
          "name": "tempTokenAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tempTokenAccountAuthority",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "ephemeral_token_account_auth"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Deposit",
                "path": "deposit"
              }
            ]
          }
        },
        {
          "name": "destinationAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "assetMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "marginfi_account"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Deposit",
                "path": "deposit"
              }
            ]
          }
        },
        {
          "name": "marginfiGroup",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginfiBank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginfiBankVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginfiBankVaultAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginfiProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "Campaign",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "lockupPeriod",
            "type": "u64"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "maxDeposits",
            "type": "u64"
          },
          {
            "name": "remainingCapacity",
            "type": "u64"
          },
          {
            "name": "maxRewards",
            "type": "u64"
          },
          {
            "name": "marginfiBankPk",
            "type": "publicKey"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u64",
                16
              ]
            }
          }
        ]
      }
    },
    {
      "name": "Deposit",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "campaign",
            "type": "publicKey"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u64",
                16
              ]
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "CampaignNotActive",
      "msg": "Campaign is not active"
    },
    {
      "code": 6001,
      "name": "DepositAmountTooLarge",
      "msg": "Deposit amount is to large"
    },
    {
      "code": 6002,
      "name": "DepositNotMature",
      "msg": "Deposit hasn't matured yet"
    }
  ]
}
