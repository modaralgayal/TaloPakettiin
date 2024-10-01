import { scanTable, addItemToTable } from "../services/dynamoServices.js";

export const getChars = async (req, res) => {
  try {
    const items = await scanTable();
    res.status(200).json(items);
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message + " Unable to Fetch characters" });
  }
};

export const addItem = async (req, res) => {
  const { id, userType, name } = req.body;

  try {
    await addItemToTable({ id, userType, name });
    res.status(201).json({ message: "Item added successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Unable to add item" });
  }
};
