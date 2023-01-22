const app = {

    name: 'app',
    api: '/api/',
    access_token_key: 'access_token',
    eventBus: new EVENT_BUS.EventBus(),

    d(...args) {
        console.log(this.name, args);
    },

    serializeForm(form_selector) {
        const arr = $(form_selector).serializeArray();
        const data = {};
        $.map(arr, function(n, i){
            data[n['name']] = n['value'];
        });
        return data;
    },

    setToken(token = null) {
        localStorage.setItem(this.access_token_key, token);
    },

    getToken() {
        return localStorage.getItem(this.access_token_key);
    },

    getTokenHeader(request) {
        request.setRequestHeader("x-auth-token", this.getToken());
    },

    get(endpoint, done, fail) {
        const url = this.api + endpoint;
        this.d(`get ${url}`);
        const self = this;
        const getTokenHeader = this.getTokenHeader.bind(this);
        $.ajax({
            beforeSend: getTokenHeader,
            url: url,
            dataType: 'json',
            data: {},
            complete: function(xhr, statusText){
                if (xhr.status === 401) {
                    document.location.href = "/login";
                } else {
                    if (done) {
                        done(xhr, statusText);
                    }
                }
            },
            error: function(xhr, statusText, err){
                if (fail) {
                    fail(xhr, statusText, err);
                }
            }
        });
    },

    post(endpoint, data, done, fail) {
        const url = this.api + endpoint;
        this.d(`post ${url}`, data);
        const self = this;
        const getTokenHeader = this.getTokenHeader.bind(this);
        $.ajax({
            beforeSend: getTokenHeader,
            type : "POST",
            url: url,
            dataType: 'json',
            data: data,
            complete: function(xhr, statusText){
                if (endpoint !== 'login' && xhr.status === 401) {
                    document.location.href = "/login";
                } else {
                    done(xhr, statusText);
                }
            },
            error: function(xhr, statusText, err){
                fail(xhr, statusText, err);
            }
        });
    },

    logout() {
        this.d(`logout`);
        event.preventDefault();
        localStorage.removeItem(this.access_token_key);
        document.location.href = "/login";
    },

    hideLoading() {
        $(".loading").addClass("hidden");
    },

    getConfig() {
        const self = this;
        this.get('config', (res) => {
            if (res.responseJSON.status === 'OK') {
                self.config = res.responseJSON.config;
                self.eventBus.publish('config_loaded', 'ready');
            }
        });
    },

    run() {
        this.d("run");
        this.getConfig();
        $(".logout").click(this.logout.bind(this));
        if ($.inArray(document.location.pathname, [ '/login', '/logout' ]) === -1) {
            this.get("user", (xhr) => {
                if (document.location.pathname === '/') {
                    document.location.href = "/main";
                } else {
                    this.hideLoading();
                }
            });
        } else {
            this.hideLoading();
        }
    }

}
$(function(){
    app.run();
});
