FROM openjdk:8-jre

WORKDIR /app
ADD ./turbine-executable-2.0.0-DP.3-SNAPSHOT.jar /app/turbine.jar

EXPOSE 80

CMD java -jar turbine.jar --port 80 --streams "$TURBINE_STREAMS"