var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
import axios from "axios";
const app = express();
app.use(express.json());
app.get('/', (req, res) => {
    res.send('This is a GET request at /');
});
app.get('/:formId/filteredResponses', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { formId } = req.params;
    const { filters } = req.query;
    let parsedFilters;
    if (!filters) {
        return res.status(400).json({ error: 'No filters were provided.' });
    }
    if (typeof filters === 'string') {
        parsedFilters = JSON.parse(filters);
    }
    else {
        throw Error;
    }
    try {
        const response = yield axios.get(`https://api.fillout.com/v1/api/forms/${formId}/submissions`, {
            headers: {
                'Authorization': `Bearer ${process.env.BEARER_TOKEN}`
            }
        });
        const filteredResponses = response.data.responses.filter((response) => {
            return parsedFilters.every(filter => {
                const question = response.questions.find((q) => q.id === filter.id);
                if (!question)
                    return false;
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
    }
    catch (error) {
        res.status(500).json({ error: error.toString() });
    }
}));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something is broken!");
});
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
