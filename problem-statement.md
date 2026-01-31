---
icon: square-xmark
---

# Problem Statement

{% stepper %}
{% step %}
### The Paradox of Centralized Custodianship & Corporate Surveillance

Most digital records today are stored on centralized cloud platforms (e.g., Google Drive, Dropbox, iCloud). While these services offer convenience, they operate on a custodial model that creates inherent vulnerabilities.

#### Privacy Erosion

Centralized providers possess the technical "Master Keys" to your data. They can scan, index, and analyze private documents for commercial purposes or comply with government data requests without your direct knowledge or consent. Privacy is treated as a "policy" that can change, rather than a technical guarantee.

#### Systemic Fragility

These platforms represent a single point of failure. A breach in a central data center exposes millions of sensitive files simultaneously. For users, birth certificates, tax records, and legal contracts are only as secure as a third party's internal security protocols and employee integrity.

{% hint style="success" %}
SentryGate's Solution:

* Client-side encryption ensures a zero-knowledge architecture.
* No central authority can access raw documents.
* Implementation: Web Crypto API in frontend, AES-256-GCM encryption.
{% endhint %}
{% endstep %}

{% step %}
### The Fragility and Friction of Physical Records

Important physical documents (diplomas, land deeds, notarized contracts, passports) are unique, non-fungible assets that are difficult to protect and verify in the real world.

#### Environmental Degradation

Physical paper is susceptible to fire, humidity, flooding, and decay. In disaster-prone regions, loss of physical documentation can cause immediate loss of legal identity, property rights, or professional standing.

#### Bureaucratic Bottlenecks

Replacing a lost original involves:

* High administrative fees
* Months of manual verification
* Archaic steps that have remained largely unchanged for decades

Reliance on physical paper trails creates massive friction in a high-speed global economy.

{% hint style="success" %}
SentryGate's Solution:

* Immutable on-chain anchoring of document hashes.
* Permanent IPFS storage with content-addressed CIDs.
* Implementation: `Document` struct stores CID, hash, and encrypted metadata: /src/SentryGate.sol#L22-L27
{% endhint %}
{% endstep %}

{% step %}
### Authenticity in the "Post-Truth" and AI Era

Digital manipulation and AI-generated content make it nearly impossible to distinguish originals from sophisticated forgeries.

#### Tampering Vulnerabilities

A standard PDF certificate can be altered by anyone with basic tools. There is no public, instantaneous way for a third party (employer, bank, or government agency) to verify if a document was modified after issuance without re-contacting the issuer.

#### Verification Latency

Institutions spend thousands of man-hours manually cross-referencing credentials with issuing authorities. The lack of a cryptographic root of trust leads to massive inefficiencies across labor, education, and legal markets.

{% hint style="success" %}
SentryGate's Solution:

* SHA-256 document hash anchored on Base blockchain.
* Immutable timestamp provides proof of existence at a specific time.
* Implementation: `Document.docHash` field and `Document.timestamp` field: /src/SentryGate.sol#L24 and /src/SentryGate.sol#L26
{% endhint %}
{% endstep %}

{% step %}
### Fragmented Access Control & Billing Opacity

Current high-security storage solutions rely on traditional banking rails and opaque subscription models, causing lack of transparency and reliability.

#### Access Opacity

In traditional SaaS, there's no transparent, verifiable way for a user to know exact access duration or the conditions under which data might be locked or deleted. Access is controlled by a private database, not transparent logic.

#### The "Billing Lockout" Risk

In centralized billing systems, a single credit card expiration or banking error can result in immediate data lockout. These systems lack a decentralized, on-chain audit trail that guarantees a user's right to access their own vault based on a verifiable transaction history.

{% hint style="success" %}
SentryGate's Solution:

* Transparent on-chain subscription tracking via x402 protocol.
*   Implementation:

    * `subExpiry` mapping - tracks subscription expiration per user:&#x20;

    &#x20;       /src/SentryGate.sol#L30

    * `uploadCredits` mapping - tracks upload credits:&#x20;

    &#x20;      /src/SentryGate.sol#L31

    * `verifyPayment()` function - public view for transparent access verification: /src/SentryGate.sol#L103-L106
    * `PaymentRequired()` custom error - enforced at smart contract level: /src/SentryGate.sol#L18
{% endhint %}
{% endstep %}
{% endstepper %}

### Conclusion

SentryGate was born out of the necessity to solve these four pillars of failure, replacing centralized trust with decentralized, mathematical proof on the Base network.

The solution is not a better "cloud service"—it's a fundamentally different paradigm built on cryptographic certainty rather than institutional promises.
