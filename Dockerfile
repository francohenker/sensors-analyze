# Dockerfile

FROM rqlite/rqlite:7.21.4

# Expose the necessary ports
EXPOSE 4001 4002

# The CMD can be adjusted based on how you want to initialize the nodes
CMD ["rqlited", "-node-id", "node1", "/rqlite/data"]
