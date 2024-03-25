import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

app.get('/:formId/filteredResponses', async (req, res) => {
    const { formId } = req.params;
    const { filters } = req.query;
    // console.log("filters before: ", filters);
    const parsedFilters = JSON.parse(filters);
    // console.log("parsedFilters after: ", parsedFilters);

    try {
        const response = await axios.get(`https://api.fillout.com/v1/api/forms/${formId}/submissions`, {
            headers: {
                'Authorization': `Bearer sk_prod_TfMbARhdgues5AuIosvvdAC9WsA5kXiZlW8HZPaRDlIbCpSpLsXBeZO7dCVZQwHAY3P4VSBPiiC33poZ1tdUj2ljOzdTCCOSpUZ_3912`
            }
        });

        // console.log(response.data);

        const filteredResponses = response.data.responses.filter(response => {
            return parsedFilters.every(filter => {
                // console.log(response.questions);
                const question = response.questions.find(q => q.id === filter.id);
                // console.log(question);
                if (!question) return false;

                switch (filter.condition) {
                    case 'equals':
                        return question.value === filter.value;
                    case 'does_not_equal':
                        return question.value !== filter.value;
                    case 'greater_than':
                        return new Date(question.value) > new Date(filter.value);
                    case 'less_than':
                        return new Date(question.value) < new Date(filter.value);
                    default:
                        return false;
                }
            });
        });

        res.json({
            responses: filteredResponses,
            totalResponses: filteredResponses.length,
            pageCount: Math.ceil(filteredResponses.length / 10)
        });
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
