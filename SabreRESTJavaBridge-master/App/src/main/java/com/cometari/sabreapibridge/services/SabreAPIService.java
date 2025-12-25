package com.cometari.sabreapibridge.services;

import java.text.MessageFormat;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.cometari.sabreapibridge.config.Oauth2Config;
import com.cometari.sabreapibridge.domain.AccessToken;
import com.cometari.sabreapibridge.domain.Oauth2Client;
import com.cometari.sabreapibridge.handlers.ApiResponseErrorHandler;

@Service
public class SabreAPIService {

	static Logger log = Logger.getLogger(SabreAPIService.class.getName());

	@Autowired
	private Oauth2Config oauth2Config;

	@Autowired
	private Oauth2Client oauth2Client;

	@Autowired
	ApiResponseErrorHandler responseErrorHandler;

	private AccessToken accessToken;
	private String BASE_URL;

	@PostConstruct
	void init() {
		BASE_URL = oauth2Config.getSabreBaseUrl();
	}

	@PostConstruct
	void authorization() {
		// Run in a new thread to avoid blocking startup
		new Thread(() -> {
			try {
				log.info("Attempting Sabre Authentication...");
				accessToken = oauth2Client.executeAccessTokenRequest();
				log.info("Sabre Authentication Successful.");
			} catch (Exception e) {
				log.error("Failed to authenticate with Sabre on startup.", e);
			}
		}).start();
	}

	public ResponseEntity<?> getRequest(String redirectURL) {
		
		ResponseEntity<?> response = executeGetRequest(redirectURL);
		try {
			// If response is null (due to connection issue), error out
			if (response == null) {
				return new ResponseEntity<String>("Upstream Connection Error", org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE);
			}

			if (ApiResponseErrorHandler.isError(response.getStatusCode())) {
				throw new RestClientException(MessageFormat.format("Response from: {0}{1} HttpStatus: {2}", BASE_URL,redirectURL, response.getStatusCode()));
			}
		} catch (Exception e) {
			log.info(e.getMessage());
			if(e.getMessage() != null && e.getMessage().contains("HttpStatus: 401")){
				// Blocking auth retry on 401 is fine, but we should be careful about infinite loops
				// Let's just try once synchronously here
				try {
					accessToken = oauth2Client.executeAccessTokenRequest();
					response = executeGetRequest(redirectURL);
					log.info("Refresh AccessToken and Resend Request");
				} catch(Exception ex) {
					log.error("Re-auth failed", ex);
				}
			}
		}
		if (response != null) {
			log.info(MessageFormat.format("Response from: {0}{1} HttpStatus: {2}", BASE_URL,redirectURL, response.getStatusCode()));
		}
		return response;
	}

	public ResponseEntity<?> postRequest(String redirectURL, HttpEntity<?> requestBody) {
		ResponseEntity<?> response = executePostRequest(redirectURL, requestBody);
		try {
			if (response == null) {
				return new ResponseEntity<String>("Upstream Connection Error", org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE);
			}

			if (ApiResponseErrorHandler.isError(response.getStatusCode())) {
				throw new RestClientException(MessageFormat.format("Response from: {0}{1} HttpStatus: {2}", BASE_URL,redirectURL, response.getStatusCode()));
			}
		} catch (Exception e) {
			log.info(e.getMessage());
			if(e.getMessage() != null && e.getMessage().contains("HttpStatus: 401")){
				try {
					accessToken = oauth2Client.executeAccessTokenRequest();
					response = executePostRequest(redirectURL, requestBody);
					log.info("Refresh AccessToken and Resend Request");
				} catch(Exception ex) {
					log.error("Re-auth failed", ex);
				}
			}
		}
		if (response != null) {
			log.info(MessageFormat.format("Response from: {0}{1} HttpStatus: {2}", BASE_URL,redirectURL, response.getStatusCode()));
		}
		return response;
	}
	
	private ResponseEntity<?> executeGetRequest(String redirectURL) {
		try {
			HttpHeaders headers = new HttpHeaders();
			String token = (accessToken != null) ? accessToken.getAccessToken() : "DUMMY";
			headers.add("Authorization", "Bearer " + token);
			HttpEntity<String> request = new HttpEntity<String>(headers);
			RestTemplate restTemplate = new RestTemplate(new HttpComponentsClientHttpRequestFactory());
			restTemplate.setErrorHandler(responseErrorHandler);
			restTemplate.getMessageConverters().add(new MappingJackson2HttpMessageConverter());
			ResponseEntity<?> response = restTemplate.exchange(BASE_URL + redirectURL, HttpMethod.GET, request, Map.class);
			return response;
		} catch (Exception e) {
			log.error("Error executing GET request to Sabre", e);
			return null;
		}
	}
	
	private ResponseEntity<?> executePostRequest(String redirectURL, HttpEntity<?> requestBody) {
		try {
			HttpHeaders headers = new HttpHeaders();
			String token = (accessToken != null) ? accessToken.getAccessToken() : "DUMMY";
			headers.add("Authorization", "Bearer " + token);
			headers.add("Content-Type", "application/json");
			headers.add("Accept-Encoding", "gzip");
			HttpEntity<?> request = new HttpEntity<Object>(requestBody.getBody(), headers);
			RestTemplate restTemplate = new RestTemplate(new HttpComponentsClientHttpRequestFactory());
			restTemplate.setErrorHandler(responseErrorHandler);
			restTemplate.getMessageConverters().add(new MappingJackson2HttpMessageConverter());
			ResponseEntity<?> response = restTemplate.exchange(BASE_URL + redirectURL, HttpMethod.POST, request, Map.class);
			System.out.println(response.getBody());
			return response;
		} catch (Exception e) {
			log.error("Error executing POST request to Sabre", e);
			return null;
		}
	}

}
