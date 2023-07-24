<template>
  <h1>SoundCloud Downloader</h1>
  <div v-if="isFetching">
    <h3>{{ downloadPhrase }}</h3>
    <div class="loader"></div>
  </div>
  <div v-else>
    <div v-if="!audioLink">
      <input v-model="input" class="ie" type="text" placeholder="Enter SoundCloud song url">
      <br>
      <p style="color: red;">{{ error }}</p>
    </div>
    <div v-else style="padding-bottom: 1rem;">
      <h4>{{ audioTitle }}</h4>
      <a class="ie" target="_blank" v-bind:href="audioLink">Get song</a>
    </div>
    <button class="ie" @click="download()">{{ btnText }}</button>
  </div>
</template>

<script>
export default {
  data() {
  return {
    audioLink:null,
    audioTitle:null,
    error:null,
    input:'',
    csrfToken:'',
    btnText:'Download',
    isFetching:false,
    downloadPhrase:'Loading'
  };
},
async beforeMount() {
  try{
      const response = await this.axios.get('/internal');
      this.csrfToken = response.headers['x-token'];
      console.log("got token");
    }
    catch(err)
    {
      this.error = err.message;
      console.error("Internal error",err.message);
    }
},
methods: {
  async download() {
    if (this.audioLink)
    {
      this.btnText = 'Download';
      return this.audioLink = '';
    }
    try{
      const form = new FormData();
      form.append('link',this.input);
      const waitPhrase = setTimeout(()=>
      this.downloadPhrase = 'Just a little more...',5000);
      this.isFetching = true;
      const response = await this.axios.post('/internal',form,{
        headers:{
          "Content-Type":'multipart/form-data',
          'X-CSRF-Token':this.csrfToken
        }
      });
      clearTimeout(waitPhrase);
      this.downloadPhrase='Download';
      this.error = null;
      this.audioLink = response.data.result;
      this.audioTitle = response.data.title;
      this.input = '';
      this.btnText ='Download another';
    }
    catch(err)
    {
      const errmsg = err?.response?.data?.error ?? err.message;
      this.error = errmsg;
      if (errmsg == err.message)
      console.error("Internal error",err);
    }
    finally{
      this.isFetching=false;
    }
  }
}
};
</script>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
