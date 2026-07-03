export type DarkProtocol = {
  "address": "DARKxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
  "metadata": {
    "name": "dark_protocol",
    "version": "0.2.0",
    "spec": "0.1.0"
  },
  "version": "0.2.0",
  "name": "dark_protocol",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "shield",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "commitment",
          "type": {
            "array": ["u8", 32]
          }
        }
      ]
    },
    {
      "name": "unshield",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "recipient",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "nullifier",
          "type": {
            "array": ["u8", 32]
          }
        },
        {
          "name": "proof",
          "type": "bytes"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "ProtocolState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "merkleRoot",
            "type": {
              "array": ["u8", 32]
            }
          },
          {
            "name": "totalShielded",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidProof",
      "msg": "Invalid zero-knowledge proof"
    },
    {
      "code": 6001,
      "name": "DuplicateNullifier",
      "msg": "Nullifier has already been used"
    }
  ]
};

export const IDL: DarkProtocol = {
  "address": "DARKxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
  "metadata": {
    "name": "dark_protocol",
    "version": "0.2.0",
    "spec": "0.1.0"
  },
  "version": "0.2.0",
  "name": "dark_protocol",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "shield",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "commitment",
          "type": {
            "array": ["u8", 32]
          }
        }
      ]
    },
    {
      "name": "unshield",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "recipient",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "nullifier",
          "type": {
            "array": ["u8", 32]
          }
        },
        {
          "name": "proof",
          "type": "bytes"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "ProtocolState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "merkleRoot",
            "type": {
              "array": ["u8", 32]
            }
          },
          {
            "name": "totalShielded",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidProof",
      "msg": "Invalid zero-knowledge proof"
    },
    {
      "code": 6001,
      "name": "DuplicateNullifier",
      "msg": "Nullifier has already been used"
    }
  ]
};
