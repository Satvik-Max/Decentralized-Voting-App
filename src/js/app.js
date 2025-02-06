// Import Web3 and Truffle contract
const Web3 = require('web3');
const contract = require('@truffle/contract');

// Import contract artifacts
const votingArtifacts = require('../../build/contracts/Voting.json');
var VotingContract = contract(votingArtifacts);

// Initialize the app
window.App = {
  // Start the app and set up event listeners
  async eventStart() {
    try {
      // Request user accounts (Metamask)
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Ensure an account is selected
      if (accounts.length === 0) {
        console.error("No account selected. Please connect your wallet.");
        return;
      }

      // Set provider and defaults
      VotingContract.setProvider(window.ethereum);
      VotingContract.defaults({ from: accounts[0], gas: 6654755 });
      App.account = accounts[0];

      // Display account address
      $("#accountAddress").html("Your Account: " + accounts[0]);

      // Deploy contract instance and get data
      const instance = await VotingContract.deployed();
      const countCandidates = await instance.getCountCandidates();

      // Handle candidates and display them
for (let i = 0; i < countCandidates; i++) {
  try {
    const data = await instance.getCandidate(i + 1);

    // Log the returned data to inspect its structure
    console.log("Candidate data:", data);

    // Ensure that the data has the expected structure
    if (data && data[0] && data[1] && data[2] && data[3]) {
      // Convert BigNumbers to strings or numbers
      const id = data[0].toString();  // Convert BigNumber to string (for id)
      const name = data[1];           // Regular string (name)
      const party = data[2];          // Regular string (party)
      const voteCount = data[3].toString(); // Convert BigNumber to string (for voteCount)

      // Create the candidate row in HTML
      const viewCandidates = `
        <tr>
          <td><input class="form-check-input" type="radio" name="candidate" value="${id}" id="${id}">${name}</td>
          <td>${party}</td>
          <td>${voteCount}</td>
        </tr>`;
      $("#boxCandidate").append(viewCandidates);
    } else {
      console.error("Unexpected candidate data format:", data);
    }
  } catch (err) {
    console.error(`Error fetching candidate ${i + 1}: `, err.message);
  }
}

      window.countCandidates = countCandidates;

      // Handle election dates
      try {
        const result = await instance.getDates();
        const startDate = new Date(result[0] * 1000);
        const endDate = new Date(result[1] * 1000);
        $("#dates").text(`${startDate.toDateString()} - ${endDate.toDateString()}`);
      } catch (err) {
        console.error("Error fetching election dates:", err.message);
      }

      // Check if the user has already voted
      const voted = await instance.checkVote();
      if (!voted) {
        $("#voteButton").attr("disabled", false);
      }

      // Add candidate functionality
      $('#addCandidate').click(async function () {
        const nameCandidate = $('#name').val();
        const partyCandidate = $('#party').val();
        if (nameCandidate && partyCandidate) {
          try {
            await instance.addCandidate(nameCandidate, partyCandidate);
            console.log("Candidate added successfully.");
          } catch (err) {
            console.error("Error adding candidate:", err.message);
          }
        } else {
          console.log("Candidate name and party must be provided.");
        }
      });

      // Set election dates functionality
      $('#addDate').click(async function () {
        const startDate = Date.parse($("#startDate").val()) / 1000;
        const endDate = Date.parse($("#endDate").val()) / 1000;
        if (!startDate || !endDate) {
          console.log("Invalid date values provided.");
          return;
        }
        try {
          await instance.setDates(startDate, endDate);
          console.log("Election dates set");
        } catch (err) {
          console.error("Error setting election dates:", err.message);
        }
      });

    } catch (err) {
      console.error("ERROR! " + err.message);
    }
  },

  // Handle voting functionality
  async vote() {
    const candidateID = $("input[name='candidate']:checked").val();
    if (!candidateID) {
      $("#msg").html("<p>Please vote for a candidate.</p>");
      return;
    }

    try {
      const instance = await VotingContract.deployed();
      await instance.vote(parseInt(candidateID));
      $("#voteButton").attr("disabled", true);
      $("#msg").html("<p>Voted</p>");
      window.location.reload(1);
    } catch (err) {
      console.error("ERROR! " + err.message);
    }
  }
};

// Event listener for window load
window.addEventListener("load", function () {
  if (typeof window.ethereum !== "undefined") {
    console.warn("Using web3 detected from external source like Metamask");
    window.eth = new Web3(window.ethereum);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:9545. You should remove this fallback when you deploy live.");
    window.eth = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
  }

  // Start the app when the page is loaded
  window.App.eventStart();
});
