<template>
  <head>
    <!-- Bootstrap CSS -->
    <link
      rel="stylesheet"
      href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css"
      integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO"
      crossorigin="anonymous"
    />
  </head>
  <div id="app">
    <div class="row">
      <div class="col-md-6">
        <!-- <img src="../assets/webtvasia logo.png" alt="Logo" class="logo-small" />
        <img src="../assets/login image.jpg" alt="Display" class="img-fluid" /> -->
      </div>

      <div class="col-md-6 right-content">
        <h1>Welcome Back!</h1>

        <!-- Email and Password Fields -->
        <div class="form-group">
          <input
            type="email"
            class="form-control"
            placeholder="Email"
            v-model="email"
            style="opacity: 0.7"
          />
          <br />
          <input
            type="password"
            class="form-control"
            placeholder="Password"
            v-model="password"
            style="opacity: 0.7"
          />
          <br />
          <vue3-google-login
            v-on:googleLoginSuccess="onGoogleAuthSuccess"
            googleLoginFailure="onGoogleAuthFail"
          />
        </div>

        <!-- Remember Me and Forgot Password -->
        <div class="form-check">
          <div class="row">
            <div class="col-sm-5">
              <input type="checkbox" id="rememberMe" />
              <label for="rememberMe">Remember me</label>
            </div>
            <a
              href="#"
              @click="login"
              class="float-right col-sm-6"
              style="text-align: right; padding-right: 10px"
              >Forgot password?</a
            >
          </div>
        </div>

        <!-- Login and Google Login Buttons -->
        <div class="container">
          <div class="row" >
            <button
              @click="manualLogin" class="col-sm-5 btn btn-primary">
              Login
            </button>

            <button @click="login" class="col-sm-5 btn btn-secondary" style="margin-right: -28px">
              Google Login
            </button>
            <!--
            <vue3-google-login
              v-on:googleLoginSuccess="onGoogleAuthSuccess"
              v-on:googleLoginFailure="onGoogleAuthFail"
            >
            </vue3-google-login>
            -->
            <!--from back end-->
            <div v-if="userDetails">
              <h2>User Details</h2>
              <p>Name: {{ userDetails.name }}</p>
              <p>Email: {{ userDetails.email }}</p>
              <p>
                Profile Picture:
                <img :src="userDetails.picture" alt="Profile Picture" />
              </p>
            </div>
          </div>
        </div>

        <!-- Sign Up Link -->
        <p class="text-center" style="padding-top: 10px">
          No account? <a href="#" @click="login">Sign up</a>
        </p>
      </div>
    </div>
  </div>
</template>
  
<script>
import { googleSdkLoaded } from "vue3-google-login";
import axios from "axios";
//import vue3GoogleLogin from 'vue3-google-login';

export default {
  //Exports the Vue component definition.
  data() {
    //Returns the component's reactive data properties.
    return {
      email: "",
      password: "",
      userDetails: null,
      videos: [],
      //validationMessage: ''
    };
  },
  methods: {
    onGoogleAuthSuccess(googleUser) {
      const accessToken = googleUser.getAuthResponse().access_token;
      localStorage.setItem("youtube_access_token", accessToken);
      console.log(
        "Saved Access Token:",
        localStorage.getItem("youtube_access_token")
      );

      axios
        .post("/auth/youtube", { accessToken })
        .then(() => {
          this.$nextTick(() => {
            this.$router.push("/video_HomePage");
          });
        })
        .catch((error) => {
          console.error("Error during YouTube authentication:", error);
        });
    },

    manualLogin() {
      //temp
      if (this.email && this.password) {
        // Navigate to home-video page
        this.$router.push("/video_HomePage");
      } else {
        // Handle invalid login attempt
        alert("Please enter both email and password");
      }
      // Send email and password to your backend for authentication
      axios
        .post("http://localhost:/auth/callback", {
          email: this.email,
          password: this.password,
        })
        .then((response) => {
          // Handle successful login
          this.userDetails = response.data;
          this.$router.push("/video_HomePage");
        })
        .catch((error) => {
          console.error("Login error:", error);
        });
    },
    login() {
      console.log("Login has started!");
      googleSdkLoaded((google) => {
        //A function ensures the Google SDK is loaded before executing the login logic.
        google.accounts.oauth2
          .initCodeClient({
            client_id:
              "785497567658-16251n3ml1bu0mp440s4krbsi25obke7.apps.googleusercontent.com",
            scope: "email profile openid https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/yt-analytics-monetary.readonly",
            redirect_uri: "http://localhost:3000/auth/callback",
            callback: (response) => {
              if (response.code) {
                console.log(response);
                this.sendCodeToBackend(response.code);
              }
            },
          }).requestCode(); //Google authentication and consent screens are displayed.
      });
    },
    async sendCodeToBackend(code) {
      try {
        const headers = {
          Authorization: code,
        };
        console.log("Runnning sendCodeToBackend");
        const response = await axios.post(
          "http://localhost:3000/auth/callback",
          null,
          { headers }
        );
        console.log("Response", response);
        //this.userDetails = response.data;
        this.videos = response.data.videos.items;
        console.log("YouTube videos data:", this.videos);
        this.$store.commit("setVideos", this.videos);
        console.log("Current videos in store:", this.$store.state.videos);

        const userDetails = response.data;
        console.log("User Data:", userDetails);
        this.userDetails = userDetails;

        this.$router.push("/video_HomePage");
      } catch (error) {
        console.error("Failed to send authorization code:", error);
      }
    },
    async fetchYouTubeAnalyticsData() {
    const accessToken = localStorage.getItem('youtube_access_token');
    try {
      const response = await axios.get('https://youtubeanalytics.googleapis.com/v2/reports', {
        params: {
          // Define your parameters here, for example:
          ids: 'channel==MINE',
          metrics: 'estimatedRevenue,adImpressions,cpm',
          startDate: '2021-01-01',
          endDate: '2021-12-31',
          dimensions: 'month',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assuming you want to pass this data to another component, like finance_info
      this.$router.push({ name: 'finance-info', query: { analyticsData: JSON.stringify(response.data) } });
    } catch (error) {
      console.error("Error fetching YouTube Analytics data:", error);
    }
  },
  },
};
</script>
  
<style>
.logo-small {
  max-width: 100px; /* Adjust the size as necessary */
  margin-top: 20px; /* Spacing from the top */
  margin-left: 20px; /* Spacing from the side */
}

.img-fluid {
  width: 100%; /* Full width of the column */
  border-radius: 5px; /* Optional: if you want rounded corners */
  margin: 10px; /* Space between logo and image */
  padding: 30px;
}

/* Styling for the form section */
.form-group input {
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid #ddd;
  color: #333;
}

.form-check {
  padding: 0;
  margin-top: -10px;
  margin-bottom: 10px;
}

input[type="checkbox"] {
  width: 15px;
  height: 15px;
  margin-right: 10px;
}

.row {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.float-left {
  margin-left: 0;
}

.float-right {
  margin-right: 0;
}

/* Customizations for buttons */
.btn-primary {
  background-color: #0056b3; /* Example primary color */
  border-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d; /* Example secondary color */
  border-color: #6c757d;
}

/* Spacing and alignment for the right-hand side content */
.right-content {
  padding: 40px 80px 40px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .logo-small {
    margin-left: 10px; /* Less spacing on smaller screens */
  }

  .right-content {
    margin-left: 20px; /* Less spacing on smaller screens */
  }

  .img-fluid {
    margin-top: 10px;
  }

  /* Stack columns vertically on smaller screens */
  .col-sm-6,
  .col-lg-6 {
    flex: 0 0 100%;
    max-width: 100%;
  }
}
</style>


