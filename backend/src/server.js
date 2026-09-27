const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const knowledgeBase = [
  {
    id: "KB-WLAN-002",
    domain: "Wireless",
    title: "Wireless DHCP Troubleshooting Runbook",
    keywords: ["wifi", "wi-fi", "wireless", "dhcp", "ip address"],
    diagnosis:
      "The client successfully authenticated to Wi-Fi, so the failure is likely in the DHCP, VLAN, relay, or address-assignment path.",
    checks: [
      "Confirm the client is assigned to the expected VLAN.",
      "Verify the DHCP scope has available addresses.",
      "Check DHCP relay or helper configuration.",
      "Confirm the gateway and VLAN interfaces are operational."
    ],
    nextSteps: [
      "Validate DHCP reachability from the wireless client VLAN.",
      "Compare the WLAN-to-VLAN mapping with the approved wireless design."
    ]
  },
  {
    id: "KB-AAA-001",
    domain: "AAA/NAC",
    title: "Enterprise RADIUS and AAA Troubleshooting Standard",
    keywords: ["radius", "aaa", "ise", "802.1x", "8021x", "authentication"],
    diagnosis:
      "RADIUS authentication failures may result from server reachability, incorrect AAA groups, source-interface configuration, or outdated server definitions.",
    checks: [
      "Verify RADIUS server reachability.",
      "Confirm the configured AAA server group.",
      "Check the RADIUS source interface.",
      "Review authentication failure logs."
    ],
    nextSteps: [
      "Compare the device configuration with the approved AAA standard.",
      "Confirm the active RADIUS servers are healthy before making changes."
    ]
  },
  {
    id: "KB-BGP-003",
    domain: "Routing & Switching",
    title: "BGP Neighbor Troubleshooting Guide",
    keywords: ["bgp", "neighbor", "active state", "routing"],
    diagnosis:
      "A BGP neighbor remaining in Active state often indicates TCP connectivity, addressing, routing, or peer-configuration problems.",
    checks: [
      "Verify IP reachability to the peer.",
      "Confirm TCP port 179 is not blocked.",
      "Check local and remote AS numbers.",
      "Verify neighbor addresses and update-source configuration."
    ],
    nextSteps: [
      "Resolve basic IP connectivity before resetting the BGP session.",
      "Compare both peer configurations for mismatched parameters."
    ]
  },
  {
    id: "KB-L2-004",
    domain: "Routing & Switching",
    title: "VLAN and Trunk Validation Standard",
    keywords: ["vlan", "trunk", "switchport", "layer 2"],
    diagnosis:
      "Layer-2 failures can result from missing VLANs, incorrect access VLAN assignments, or inconsistent trunk allowed-VLAN lists.",
    checks: [
      "Verify the VLAN exists.",
      "Confirm access-port VLAN assignment.",
      "Check trunk operational status.",
      "Compare allowed VLANs on both ends."
    ],
    nextSteps: [
      "Correct configuration inconsistencies through the approved change process."
    ]
  },
  {
    id: "KB-SDWAN-005",
    domain: "WAN",
    title: "SD-WAN Branch Connectivity Runbook",
    keywords: ["sd-wan", "sdwan", "wan", "branch", "tunnel"],
    diagnosis:
      "Branch connectivity failures may involve the WAN underlay, tunnel establishment, controller connectivity, or routing policy.",
    checks: [
      "Verify WAN underlay connectivity.",
      "Check tunnel and control connection status.",
      "Review route advertisements.",
      "Confirm routing and security policy."
    ],
    nextSteps: [
      "Determine whether the failure is in the underlay or overlay before making changes."
    ]
  },
  {
    id: "KB-DNS-006",
    domain: "Routing & Switching",
    title: "Enterprise DNS Troubleshooting Guide",
    keywords: ["dns", "hostname", "name resolution", "resolve"],
    diagnosis:
      "DNS failures may result from unreachable resolvers, incorrect DNS configuration, missing records, or filtering.",
    checks: [
      "Confirm the configured DNS server.",
      "Test DNS server reachability.",
      "Compare hostname and IP resolution.",
      "Verify the required DNS record exists."
    ],
    nextSteps: [
      "Escalate required record corrections to the DNS administration team."
    ]
  },
  {
    id: "KB-FW-007",
    domain: "Security",
    title: "Firewall Policy Troubleshooting Standard",
    keywords: ["firewall", "policy", "blocked", "security", "acl"],
    diagnosis:
      "Traffic may be blocked because of policy order, incorrect objects, application identification, ACLs, or routing.",
    checks: [
      "Review the matching security policy.",
      "Confirm source and destination objects.",
      "Check firewall traffic logs.",
      "Validate routing in both directions."
    ],
    nextSteps: [
      "Do not modify firewall policy until the intended traffic flow is validated."
    ]
  }
];

function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[-_/]/g, " ")
    .replace(/[^\w\s.]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

app.get("/health", (_req, res) => {
  res.json({
    status: "online",
    app: "NetAssist API",
    mode: "read-only"
  });
});

app.post("/api/query", (req, res) => {
  const rawQuestion = String(req.body?.question || "").trim();
  const domain = String(req.body?.domain || "All");

  if (!rawQuestion) {
    return res.status(400).json({
      error: "Please enter a troubleshooting question."
    });
  }

  const question = normalize(rawQuestion);

  const allowedDocs =
    domain === "All"
      ? knowledgeBase
      : knowledgeBase.filter((doc) => doc.domain === domain);

  const ranked = allowedDocs
    .map((doc) => ({
      doc,
      score: doc.keywords.filter((keyword) =>
        question.includes(normalize(keyword))
      ).length
    }))
    .sort((a, b) => b.score - a.score);

  const match = ranked[0];

  if (!match || match.score === 0) {
    return res.json({
      supported: false,
      message: "Insufficient evidence in the approved knowledge base."
    });
  }

  res.json({
    supported: true,
    diagnosis: match.doc.diagnosis,
    checks: match.doc.checks,
    nextSteps: match.doc.nextSteps,
    sources: [
      {
        id: match.doc.id,
        title: match.doc.title,
        domain: match.doc.domain,
        status: "Approved"
      }
    ]
  });
});


const frontendDist = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendDist));

app.use((req, res, next) => {
  if (
    req.method === "GET" &&
    !req.path.startsWith("/api/") &&
    req.path !== "/health"
  ) {
    return res.sendFile(path.join(frontendDist, "index.html"));
  }
  next();
});

app.listen(PORT, () => {
  console.log(`NetAssist API running at http://localhost:${PORT}`);
});
